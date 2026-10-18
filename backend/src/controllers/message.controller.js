import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";

import cloudinary, { isCloudinaryConfigured } from "../lib/cloudinary.js";
import { disconnectUserSocket, getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const canDeleteUsers = Boolean(adminEmail) && req.user.email.toLowerCase() === adminEmail;

    res.status(200).json({ users, canDeleteUsers });
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail || req.user.email.toLowerCase() !== adminEmail) {
      return res.status(403).json({ message: "Only the administrator can delete accounts" });
    }

    const { id: userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }

    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: "You cannot delete your own account here" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    await Message.deleteMany({
      $or: [{ senderId: user._id }, { receiverId: user._id }],
    });
    await user.deleteOne();
    disconnectUserSocket(user._id);
    io.emit("user:deleted", { userId: user._id.toString() });

    res.status(200).json({ message: "Account and chat messages deleted" });
  } catch (error) {
    console.error("Error deleting user account:", error.message);
    res.status(500).json({ message: "Unable to delete account" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({
          message: "Chat image uploads require Cloudinary credentials in backend/.env.",
        });
      }

      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
