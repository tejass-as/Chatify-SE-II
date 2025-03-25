import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthImagePattern from '../components/AuthImagePattern';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';

export const SignupPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ fullname: "", email: "", password: "", otp: "" });
    const [otpSent, setOtpSent] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const { signup, isSigningup } = useAuthStore();

    const validateForm = () => {
        if (!formData.fullname.trim()) return toast.error("Full name is required");
        if (!formData.email.trim()) return toast.error("Email is required");
        if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
        if (!formData.password) return toast.error("Password is required");
        if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");
        if (!otpSent) return toast.error("Please request and enter OTP");
        if (!formData.otp) return toast.error("OTP is required");
        return true;
    };

    const handleSendOtp = async () => {
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
            return toast.error("Enter a valid email to receive OTP");
        }
        setIsSendingOtp(true);
        try {
            await axiosInstance.post("/auth/request-signup-otp", { email: formData.email });
            toast.success("OTP sent to your email");
            setOtpSent(true);
        } catch (error) {
            toast.error(error.response?.data?.message || "Error sending OTP");
        }
        setIsSendingOtp(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) signup(formData);
    };

    return (
        <div className='min-h-screen grid lg:grid-cols-2'>
    <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center mb-8">
                <div className="flex flex-col items-center gap-2 group">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <MessageSquare className="size-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold mt-2">Create Account</h1>
                    <p className="text-base-content/60">Get started with your free account</p>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Full Name</span></label>
                    <div className="relative">
                        <User className="absolute inset-y-0 left-0 pl-3 size-5 text-base-content/40" />
                        <input type="text" className="input input-bordered w-full pl-10" placeholder="John Doe" value={formData.fullname} onChange={(e) => setFormData({ ...formData, fullname: e.target.value })} />
                    </div>
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Email</span></label>
                    <div className="relative">
                        <Mail className="absolute inset-y-0 left-0 pl-3 size-5 text-base-content/40" />
                        <input type="email" className="input input-bordered w-full pl-10" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Password</span></label>
                    <div className="relative">
                        <Lock className="absolute inset-y-0 left-0 pl-3 size-5 text-base-content/40" />
                        <input type={showPassword ? "text" : "password"} className="input input-bordered w-full pl-10" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="size-5 text-base-content/40" /> : <Eye className="size-5 text-base-content/40" />}
                        </button>
                    </div>
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text font-medium">OTP</span></label>
                    <div className="flex items-center gap-2">
                        <div className="grid grid-cols-6 gap-2 flex-grow">
                            {[...Array(6)].map((_, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    className="input input-bordered text-center w-10"
                                    value={formData.otp[index] || ""}
                                    onChange={(e) => {
                                        let newOtp = formData.otp.split("");
                                        newOtp[index] = e.target.value;
                                        setFormData({ ...formData, otp: newOtp.join("") });
                                        if (e.target.value && index < 5) {
                                            document.getElementById(`otp-${index + 1}`).focus();
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
                                            document.getElementById(`otp-${index - 1}`).focus();
                                        }
                                    }}
                                    onPaste={(e) => {
                                        const pasteData = e.clipboardData.getData("text").slice(0, 6).split("");
                                        setFormData({ ...formData, otp: pasteData.join("") });
                                        pasteData.forEach((char, idx) => {
                                            if (idx < 6) {
                                                document.getElementById(`otp-${idx}`).value = char;
                                            }
                                        });
                                        e.preventDefault();
                                    }}
                                    id={`otp-${index}`}
                                />
                            ))}
                        </div>
                        <button type="button" className="btn btn-primary" onClick={handleSendOtp} disabled={isSendingOtp}>
                            {isSendingOtp ? <Loader2 className="size-5 animate-spin" /> : "Send OTP"}
                        </button>
                    </div>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={isSigningup}>
                    {isSigningup ? <><Loader2 className="size-5 animate-spin" /> Loading...</> : "Create Account"}
                </button>
            </form>
            <div className="text-center">
                <p className="text-base-content/60">Already have an account? <Link to="/login" className="link link-primary">Sign in</Link></p>
            </div>
        </div>
    </div>
    <AuthImagePattern title="Join our community" subtitle="Connect with friends, share moments, and stay in touch with your loved ones." />
</div>
    );
};
