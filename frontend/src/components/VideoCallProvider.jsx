import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { VideoCallContext } from "../contexts/VideoCallContext";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const getRtcConfiguration = async () => {
  const response = await axiosInstance.get("/turn/credentials");
  if (!Array.isArray(response.data?.iceServers)) {
    throw new Error("The TURN relay returned invalid configuration.");
  }
  return {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      ...response.data.iceServers,
    ],
  };
};

const getMediaAccessError = (error) => {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return "Camera and microphone require HTTPS. Open the secure https:// address and trust the development certificate on this device.";
  }

  switch (error.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera or microphone access was denied. Allow both in your browser's site settings, then try again.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera or microphone was found on this device.";
    case "NotReadableError":
    case "TrackStartError":
      return "The camera or microphone is busy. Close other apps using it and try again.";
    case "OverconstrainedError":
      return "This device cannot provide the requested camera or microphone.";
    case "SecurityError":
      return "Camera and microphone access is blocked by the browser's security settings.";
    default:
      return "Could not access the camera or microphone. Check browser permissions and try again.";
  }
};

const getCallSetupError = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.name === "Error" || error.name === "AxiosError") {
    return error.message;
  }
  return getMediaAccessError(error);
};

const VideoCallProvider = ({ children }) => {
  const socket = useAuthStore((state) => state.socket);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const users = useChatStore((state) => state.users);
  const [call, setCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [needsRemotePlayback, setNeedsRemotePlayback] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const hasCall = Boolean(call);

  useEffect(() => {
    if (!hasCall || !("wakeLock" in navigator)) return undefined;

    let wakeLock = null;
    let isRequesting = false;
    let isDisposed = false;

    const acquireWakeLock = async () => {
      if (
        isDisposed ||
        isRequesting ||
        wakeLock ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      isRequesting = true;
      try {
        const requestedWakeLock = await navigator.wakeLock.request("screen");
        if (isDisposed) {
          await requestedWakeLock.release();
          return;
        }
        wakeLock = requestedWakeLock;
        wakeLock.addEventListener("release", () => {
          wakeLock = null;
        });
      } catch (error) {
        console.warn("Unable to keep the screen awake during the call:", error);
      } finally {
        isRequesting = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") acquireWakeLock();
    };

    acquireWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isDisposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch((error) => {
          console.warn("Unable to release the screen wake lock:", error);
        });
      }
    };
  }, [hasCall]);

  const updateCall = useCallback((nextCall) => {
    callRef.current = nextCall;
    setCall(nextCall);
  }, []);

  const cleanupCall = useCallback(
    (notifyPeer = false, eventName = "call:end") => {
      const currentCall = callRef.current;
      if (notifyPeer && currentCall?.remoteUser?._id) {
        socket?.emit(eventName, { to: currentCall.remoteUser._id });
      }

      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      pendingCandidatesRef.current = [];
      setLocalStream(null);
      setRemoteStream(null);
      setNeedsRemotePlayback(false);
      setIsMuted(false);
      setIsCameraOff(false);
      updateCall(null);
    },
    [socket, updateCall]
  );

  const flushPendingCandidates = useCallback(async (peerConnection, remoteUserId) => {
    const candidates = pendingCandidatesRef.current.filter(
      (queued) => queued.fromUserId === remoteUserId
    );
    pendingCandidatesRef.current = pendingCandidatesRef.current.filter(
      (queued) => queued.fromUserId !== remoteUserId
    );
    for (const { candidate } of candidates) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const createPeerConnection = useCallback(
    (remoteUserId, rtcConfiguration) => {
      const peerConnection = new RTCPeerConnection(rtcConfiguration);
      peerConnectionRef.current = peerConnection;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("call:ice", {
            to: remoteUserId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0] ?? null);
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "connected") {
          const currentCall = callRef.current;
          if (currentCall) updateCall({ ...currentCall, status: "active" });
        } else if (peerConnection.connectionState === "failed") {
          toast.error(
            "The call could not connect. If the devices are on different networks, configure a TURN relay and try again."
          );
          cleanupCall(true);
        }
      };

      return peerConnection;
    },
    [cleanupCall, socket, updateCall]
  );

  const startCall = useCallback(
    async (remoteUser) => {
      if (callRef.current) {
        toast.error("Finish your current call before starting another.");
        return;
      }
      if (!socket?.connected) {
        toast.error("The chat connection is offline. Please try again.");
        return;
      }
      if (!onlineUsers.includes(remoteUser._id)) {
        toast.error(`${remoteUser.fullName} is offline.`);
        return;
      }

      updateCall({ status: "calling", remoteUser });
      try {
        const rtcConfiguration = await getRtcConfiguration();
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          throw new DOMException("Camera and microphone require a secure context.", "SecurityError");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: { facingMode: "user" },
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        const peerConnection = createPeerConnection(remoteUser._id, rtcConfiguration);
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("call:offer", {
          to: remoteUser._id,
          offer: peerConnection.localDescription.toJSON(),
        });
      } catch (error) {
        console.error("Unable to start video call:", error);
        toast.error(getCallSetupError(error));
        cleanupCall();
      }
    },
    [cleanupCall, createPeerConnection, onlineUsers, socket, updateCall]
  );

  const acceptCall = useCallback(async () => {
    const incomingCall = callRef.current;
    if (incomingCall?.status !== "incoming" || !incomingCall.offer) return;

    updateCall({ ...incomingCall, status: "connecting" });
    try {
      const rtcConfiguration = await getRtcConfiguration();
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new DOMException("Camera and microphone require a secure context.", "SecurityError");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: { facingMode: "user" },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const peerConnection = createPeerConnection(
        incomingCall.remoteUser._id,
        rtcConfiguration
      );
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );
      await flushPendingCandidates(peerConnection, incomingCall.remoteUser._id);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("call:answer", {
        to: incomingCall.remoteUser._id,
        answer: peerConnection.localDescription.toJSON(),
      });
    } catch (error) {
      console.error("Unable to accept video call:", error);
      toast.error(getCallSetupError(error));
      cleanupCall(true, "call:decline");
    }
  }, [cleanupCall, createPeerConnection, flushPendingCandidates, socket, updateCall]);

  const declineCall = useCallback(() => {
    cleanupCall(true, "call:decline");
  }, [cleanupCall]);

  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  }, []);

  const toggleVideo = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsCameraOff(!track.enabled);
  }, []);

  const enableRemotePlayback = useCallback(async () => {
    const video = remoteVideoRef.current;
    const audio = remoteAudioRef.current;
    try {
      await Promise.all(
        [video, audio]
          .filter(Boolean)
          .map((element) => element.play())
      );
      setNeedsRemotePlayback(false);
    } catch (error) {
      console.error("Unable to play remote call media:", error);
      toast.error("Could not play the other person's camera or microphone.");
    }
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleOffer = ({ fromUserId, offer }) => {
      if (!fromUserId || !offer) return;
      if (callRef.current) {
        socket.emit("call:busy", { to: fromUserId });
        return;
      }
      const remoteUser = users.find((user) => user._id === fromUserId) ?? {
        _id: fromUserId,
        fullName: "Chat contact",
        profilePic: "",
      };
      updateCall({ status: "incoming", remoteUser, offer });
    };

    const handleAnswer = async ({ fromUserId, answer }) => {
      if (
        fromUserId !== callRef.current?.remoteUser?._id ||
        !peerConnectionRef.current ||
        !answer
      ) {
        return;
      }
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        await flushPendingCandidates(
          peerConnectionRef.current,
          callRef.current.remoteUser._id
        );
      } catch (error) {
        console.error("Unable to complete video call setup:", error);
        toast.error("Could not complete the video call connection.");
        cleanupCall(true);
      }
    };

    const handleIceCandidate = async ({ fromUserId, candidate }) => {
      if (!candidate) return;
      if (!callRef.current) {
        pendingCandidatesRef.current.push({ fromUserId, candidate });
        if (pendingCandidatesRef.current.length > 64) {
          pendingCandidatesRef.current.shift();
        }
        return;
      }
      if (fromUserId !== callRef.current.remoteUser._id) return;
      if (!peerConnectionRef.current?.remoteDescription) {
        pendingCandidatesRef.current.push({ fromUserId, candidate });
        if (pendingCandidatesRef.current.length > 64) {
          pendingCandidatesRef.current.shift();
        }
        return;
      }
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Unable to add video call network candidate:", error);
      }
    };

    const handleUnavailable = ({ fromUserId }) => {
      if (fromUserId !== callRef.current?.remoteUser?._id) return;
      toast.error("That person is no longer available for a call.");
      cleanupCall();
    };

    const handleBusy = ({ fromUserId }) => {
      if (fromUserId !== callRef.current?.remoteUser?._id) return;
      toast.error("That person is already on another call.");
      cleanupCall();
    };

    const handleDecline = ({ fromUserId }) => {
      if (fromUserId !== callRef.current?.remoteUser?._id) return;
      toast("The call was declined.");
      cleanupCall();
    };

    const handleEnd = ({ fromUserId }) => {
      if (fromUserId !== callRef.current?.remoteUser?._id) return;
      toast("The call ended.");
      cleanupCall();
    };

    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice", handleIceCandidate);
    socket.on("call:unavailable", handleUnavailable);
    socket.on("call:busy", handleBusy);
    socket.on("call:decline", handleDecline);
    socket.on("call:end", handleEnd);

    return () => {
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice", handleIceCandidate);
      socket.off("call:unavailable", handleUnavailable);
      socket.off("call:busy", handleBusy);
      socket.off("call:decline", handleDecline);
      socket.off("call:end", handleEnd);
    };
  }, [cleanupCall, flushPendingCandidates, socket, updateCall, users]);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!remoteStream) {
      setNeedsRemotePlayback(false);
      return;
    }

    const video = remoteVideoRef.current;
    const audio = remoteAudioRef.current;
    if (!video || !audio) return;

    video.srcObject = remoteStream;
    audio.srcObject = remoteStream;

    Promise.all([video.play(), audio.play()]).then(
      () => setNeedsRemotePlayback(false),
      () => setNeedsRemotePlayback(true)
    );
  }, [remoteStream]);

  useEffect(
    () => () => {
      peerConnectionRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const value = {
    startCall,
    isPeerOnline: (userId) => onlineUsers.includes(userId),
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
      {call && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-0 sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Video call with ${call.remoteUser.fullName}`}
            className="flex h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-base-100 shadow-2xl sm:h-[calc(100dvh-2rem)] sm:max-w-[min(96vw,1600px)] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-3 sm:px-5">
              <div>
                <h2 className="font-semibold">{call.remoteUser.fullName}</h2>
                <p className="text-sm text-base-content/70">
                  {call.status === "incoming" && "Incoming video call"}
                  {call.status === "calling" && "Calling..."}
                  {call.status === "connecting" && "Connecting..."}
                  {call.status === "active" && "Connected"}
                </p>
              </div>
              {localStream && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  aria-label="Your camera"
                  className="h-20 w-28 rounded-lg bg-black object-cover sm:h-28 sm:w-40"
                />
              )}
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-neutral-900">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted
                aria-label={`${call.remoteUser.fullName}'s camera`}
                className={`h-full w-full object-contain ${
                  remoteStream ? "block" : "hidden"
                }`}
              />
              <audio ref={remoteAudioRef} autoPlay />
              {!remoteStream && (
                <div className="text-center text-white">
                  <div className="avatar mb-3">
                    <div className="mx-auto h-24 w-24 rounded-full">
                      <img
                        src={call.remoteUser.profilePic || "/avatar.png"}
                        alt=""
                      />
                    </div>
                  </div>
                  <p className="px-3 text-sm sm:text-base">
                    {call.status === "incoming"
                      ? "Wants to video call you"
                      : call.status === "calling"
                        ? "Waiting for them to answer..."
                        : "Preparing the call..."}
                  </p>
                </div>
              )}
              {remoteStream && needsRemotePlayback && (
                <button
                  type="button"
                  onClick={enableRemotePlayback}
                  className="btn btn-primary absolute bottom-4"
                >
                  Tap to enable camera and microphone
                </button>
              )}
            </div>

            <div className="flex shrink-0 justify-center gap-4 p-4">
              {call.status === "incoming" ? (
                <>
                  <button
                    type="button"
                    onClick={declineCall}
                    className="btn btn-circle btn-error"
                    aria-label="Decline video call"
                    title="Decline"
                  >
                    <PhoneOff />
                  </button>
                  <button
                    type="button"
                    onClick={acceptCall}
                    className="btn btn-circle btn-success"
                    aria-label="Answer video call"
                    title="Answer"
                  >
                    <Phone />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggleAudio}
                    disabled={!localStream}
                    className={`btn btn-circle ${isMuted ? "btn-warning" : "btn-neutral"}`}
                    aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                    title={isMuted ? "Unmute microphone" : "Mute microphone"}
                  >
                    {isMuted ? <MicOff /> : <Mic />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleVideo}
                    disabled={!localStream}
                    className={`btn btn-circle ${isCameraOff ? "btn-warning" : "btn-neutral"}`}
                    aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
                    title={isCameraOff ? "Turn camera on" : "Turn camera off"}
                  >
                    {isCameraOff ? <VideoOff /> : <Video />}
                  </button>
                  <button
                    type="button"
                    onClick={() => cleanupCall(true)}
                    className="btn btn-circle btn-error"
                    aria-label="End video call"
                    title="End call"
                  >
                    <PhoneOff />
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </VideoCallContext.Provider>
  );
};

export default VideoCallProvider;
