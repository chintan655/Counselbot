import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "../Login.css"; // ✅ Reuse login styles

function ForgotPassword({ setPage }) {
    const [email, setEmail] = useState("");

    const handleSubmit = async () => {
        if (!email) return toast.error("📧 Email required!");
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, { email });
            toast.success("✅ OTP sent to your email!");
            localStorage.setItem("reset_email", email);
            setPage("reset_password");
        } catch (err) {
            toast.error(err.response?.data?.message || "❌ Failed to send OTP.");
        }
    };

    return (
        <div className="login-container">
            <h4 className="login-heading">🔁 Reset Your Password</h4>

            <input
                className="login-input"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <button className="login-btn" onClick={handleSubmit}>
                ✉️ Send OTP
            </button>

            <p className="forgot-password-container">
                <button className="forgot-password-btn" onClick={() => setPage("login")}>
                    🔙 Back to Login
                </button>
            </p>
        </div>
    );
}

export default ForgotPassword;
