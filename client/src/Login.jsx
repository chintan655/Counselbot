import React, { useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";
import "./Login.css";                   // 👈 new styles

function Login({ setPage }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useContext(AuthContext);
  const { user } = useContext(AuthContext);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast.error("Email and password are required!");
      return;
    }
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        form
      );
      console.log("ROLE:", user?.role);
      console.log("FIRM ID:", user?.firm_id);
      login(res.data.user, res.data.token);
      toast.success("Logged in successfully!");

    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Login failed");
    }
  };

  /*  Inline style only for the inputs (keeps highlight logic simple) */
  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    marginBottom: "1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "1rem",
    boxSizing: "border-box",
  };

  return (
    <div className="login-container">
      <h2 className="login-heading">🔐 Login to Continue</h2>

      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        style={inputStyle}
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        style={inputStyle}
      />

      <button className="login-btn" onClick={handleLogin}>
        🔓 Login
      </button>
      <p>
        If you don't have an account,{" "}
        <span className="link-button" onClick={() => {
          const registerButton = document.querySelector('.nav-links button:nth-child(2)');
          if (registerButton) {
            registerButton.click();
          } else {
            console.warn("Register button not found in the navigation bar.");
          }
        }}
          style={{
            textDecoration: 'underline',
            cursor: 'pointer',
            color: '#3498db',
          }}>Register here</span>
      </p>

      <p className="forgot-password-container">
        <button
          onClick={() => setPage("forgot_password")}
          className="forgot-password-btn"
        >
          🔁 Forgot Password?
        </button>
      </p>


    </div>
  );
}

export default Login;
