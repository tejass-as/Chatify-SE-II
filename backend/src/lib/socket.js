import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000, // Increased timeout
});

// User Socket Mapping
const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  const userId = socket.handshake.query.userId;
  
  if (!userId || userId === "undefined") {
    console.warn("Connection attempt without userId");
    socket.disconnect(true);
    return;
  }

  // Store user's socket
  userSocketMap[userId] = socket.id;
  
  // Broadcast online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  console.log(`User ${userId} connected. Online users:`, Object.keys(userSocketMap));

  // Video Call Event Handlers
  socket.on('start-call', (data) => {
    try {
      if (!data.to) {
        throw new Error('No recipient specified');
      }
      
      const recipientSocketId = userSocketMap[data.to];
      
      if (!recipientSocketId) {
        console.warn(`Call attempt to offline user: ${data.to}`);
        socket.emit('call-error', { 
          message: 'User is not online',
          recipient: data.to 
        });
        return;
      }

      socket.to(recipientSocketId).emit('incoming-call', {
        from: userId,
        offer: data.offer,
      });
      
      console.log(`Call initiated from ${userId}`);
    } catch (error) {
      console.error('Error in start-call:', error);
      socket.emit('call-error', { message: error.message });
    }
  });

  socket.on('call-answer', (data) => {
    try {
      const recipientSocketId = userSocketMap[data.to];
      
      if (!recipientSocketId) {
        console.warn(`Answer to offline user: ${data.to}`);
        socket.emit('call-error', { 
          message: 'User is not online',
          recipient: data.to 
        });
        return;
      }

      socket.to(recipientSocketId).emit('call-answer', {
        from: userId,
        answer: data.answer
      });
      
      console.log(`Call answered by ${userId} for ${data.to}`);
    } catch (error) {
      console.error('Error in call-answer:', error);
      socket.emit('call-error', { message: error.message });
    }
  });

  socket.on('ice-candidate', (data) => {
    try {
      const recipientSocketId = userSocketMap[data.to];
      
      if (!recipientSocketId) {
        console.warn(`ICE candidate for offline user: ${data.to}`);
        return;
      }

      socket.to(recipientSocketId).emit('ice-candidate', {
        from: userId,
        candidate: data.candidate
      });
    } catch (error) {
      console.error('Error in ice-candidate:', error);
    }
  });

  socket.on('end-call', (data) => {
    try {
      const recipientSocketId = userSocketMap[data.to];
      
      if (recipientSocketId) {
        socket.to(recipientSocketId).emit('call-ended', {
          from: userId
        });
        
        console.log(`Call ended by ${userId} for ${data.to}`);
      }
    } catch (error) {
      console.error('Error in end-call:', error);
    }
  });

  socket.on('reject-call', (data) => {
    try {
      const recipientSocketId = userSocketMap[data.to];
      
      if (recipientSocketId) {
        socket.to(recipientSocketId).emit('call-rejected', {
          from: userId
        });
        
        console.log(`Call rejected by ${userId} for ${data.to}`);
      }
    } catch (error) {
      console.error('Error in reject-call:', error);
    }
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
    
    if (userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { io, app, server };