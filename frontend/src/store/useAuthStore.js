import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useVideoCallStore } from "./useVideoCallStore.js";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  initializeSocket: (userId ) => {
    console.log("🔍 Attempting to connect with userId:", userId); // Debug log

    if (!userId) {
        console.warn("❌ userId is undefined! Not connecting to socket.");
        return null;
    }

    const socket = io('http://localhost:5001', {
      query: { userId }
    });

    console.log("hi")

    // Set socket in video call store
    useVideoCallStore.getState().setSocket(socket);

    // Setup socket listeners
    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('connect_error', (error) => {
      console.error("Connection error:", error);
    });   

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Listen for online users
    socket.on('getOnlineUsers', (users) => {
      set({ onlineUsers: users });
    });

    // Video call event listeners
    socket.on('incoming-call', (callData) => {
      useVideoCallStore.getState().handleIncomingCall(callData);
    });

    socket.on('call-answer', (answerData) => {
      useVideoCallStore.getState().handleCallAnswer(answerData);
    });

    socket.on('ice-candidate', (candidateData) => {
      useVideoCallStore.getState().handleIceCandidate(candidateData);
    });

    socket.on('end-call', () => {
      useVideoCallStore.getState().endCall();
    });

    socket.on('call-rejected', () => {
      toast.error('Call was rejected');
      useVideoCallStore.getState().endCall();
    });

    set({ socket });
    return socket;
  },

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));