import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
    authUser: null,
    isSigningup: false,
    isLoggingIng: false,
    isUpdatingProfile: false,

    isCheckingAuth: true,

    checkAuth: async() => {
        try {
            const response = await axiosInstance.get("/auth/check")
            set({authUser: response.data})
        } catch (error) {
            console.log("Error in checkAuth", error)
            set({authUser: null})
        } finally{
            set({isCheckingAuth: false})
        }
    },

    signup: async (data) => {
        set({isSigningup: true})
        try {
            const response = await axiosInstance.post("/auth/signup", data);
            set({authUser:response.data})
            toast.success("Account created successfully")
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({isSigningup: false})
        }
    },
    
    login: async (data) => {
        set({isLoggingIng: true})
        try {
            const response = await axiosInstance.post("/auth/login", data);
            set({authUser: response.data})
            toast.success("Logged in successfully");
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({isLoggingIng: false})
        }
    },
    
    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({authUser: null});
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

}))