import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

export const isAllowedClientOrigin = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  const defaultDevelopmentOrigin =
    process.env.NODE_ENV === "development" ? "http://localhost:5173" : "";
  const configuredOrigins = [process.env.CLIENT_URL || defaultDevelopmentOrigin, process.env.RENDER_EXTERNAL_URL]
    .flatMap((value) => (value || "").split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  let isLocalDevelopmentOrigin = false;
  if (process.env.NODE_ENV === "development") {
    try {
      const url = new URL(origin);
      const isPrivateIpv4 =
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname) ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(url.hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(url.hostname);

      isLocalDevelopmentOrigin =
        (url.protocol === "http:" || url.protocol === "https:") &&
        ["5173", "5174"].includes(url.port) &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1" || isPrivateIpv4);
    } catch {
      isLocalDevelopmentOrigin = false;
    }
  }

  if (configuredOrigins.includes(origin) || isLocalDevelopmentOrigin) {
    callback(null, true);
    return;
  }

  callback(new Error("Origin is not allowed by the server."));
};

const io = new Server(server, {
  cors: {
    origin: isAllowedClientOrigin,
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  const forwardCallSignal = (eventName) => ({ to, ...payload }) => {
    if (typeof to !== "string" || !userSocketMap[to]) {
      socket.emit("call:unavailable", { fromUserId: to });
      return;
    }

    io.to(userSocketMap[to]).emit(eventName, {
      ...payload,
      fromUserId: userId,
    });
  };

  socket.on("call:offer", forwardCallSignal("call:offer"));
  socket.on("call:answer", forwardCallSignal("call:answer"));
  socket.on("call:ice", forwardCallSignal("call:ice"));
  socket.on("call:busy", forwardCallSignal("call:busy"));
  socket.on("call:decline", forwardCallSignal("call:decline"));
  socket.on("call:end", forwardCallSignal("call:end"));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
