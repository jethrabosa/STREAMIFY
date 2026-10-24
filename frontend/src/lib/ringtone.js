import { getRingtone } from "../constants/ringtones";

export const playRingtone = (name) => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return () => {};

  const ringtone = getRingtone(name);
  const audioContext = new AudioContextClass();
  const gain = audioContext.createGain();
  const oscillators = ringtone.frequencies.map((frequency) => {
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start();
    return oscillator;
  });
  gain.gain.value = 0;
  gain.connect(audioContext.destination);

  let isDisposed = false;
  let intervalId;
  const schedulePattern = () => {
    if (isDisposed || audioContext.state !== "running") return;

    let offset = 0;
    const now = audioContext.currentTime;
    ringtone.pattern.forEach((duration, index) => {
      gain.gain.setValueAtTime(index % 2 === 0 ? 0.08 : 0, now + offset / 1000);
      offset += duration;
    });
    gain.gain.setValueAtTime(0, now + offset / 1000);
  };

  audioContext.resume().then(
    () => {
      if (isDisposed) return;
      schedulePattern();
      intervalId = window.setInterval(
        schedulePattern,
        ringtone.pattern.reduce((total, duration) => total + duration, 0)
      );
    },
    (error) => {
      console.warn("Unable to play the call ringtone:", error);
    }
  );

  return () => {
    isDisposed = true;
    window.clearInterval(intervalId);
    const stopAt = audioContext.currentTime + 0.05;
    gain.gain.cancelScheduledValues(audioContext.currentTime);
    gain.gain.setValueAtTime(0, stopAt);
    oscillators.forEach((oscillator) => oscillator.stop(stopAt));
    audioContext.close().catch((error) => {
      console.warn("Unable to close the call ringtone audio:", error);
    });
  };
};
