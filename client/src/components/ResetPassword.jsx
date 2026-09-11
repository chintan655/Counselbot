import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "../Login.css"; // ✅ Reuse consistent design

function ResetPassword({ setPage }) {
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleSubmit = async () => {
        const email = localStorage.getItem("reset_email");
        if (!email || !otp || !newPassword) {
            toast.error("All fields are required!");
            return;
        }

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, {
                email,
                otp,
                newPassword,
            });
            toast.success("✅ Password reset! Please login.");
            setPage("login");
        } catch (err) {
            toast.error(err.response?.data?.message || "❌ Reset failed.");
        }
    };

    return (
        <div className="login-container">
            <h2 className="login-heading">🔑 Reset Your Password</h2>

            <input
                className="login-input"
                type="text"
                placeholder="Enter OTP sent to your email"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
            />
            <input
                className="login-input"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />

            <button className="login-btn" onClick={handleSubmit}>
                ✅ Reset Password
            </button>

            <p className="forgot-password-container">
                <button className="forgot-password-btn" onClick={() => setPage("login")}>
                    🔙 Back to Login
                </button>
            </p>
        </div>
    );
}

export default ResetPassword;
