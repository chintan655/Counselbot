// Register.jsx

import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";
import "./Register.css";
import { useSearchParams } from "react-router-dom";


function Register({ goToLogin }) {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const isInvite = !!inviteToken;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "client",
    firm_name: "",
    inviteToken: inviteToken || "",
  });

  const [errors, setErrors] = useState({});

  // 🔃 Optional: Auto-fill name/email from inviteToken by calling backend (optional)
  // You can skip this if backend already fills from invite token
  useEffect(() => {
    const fetchInviteData = async () => {
      if (!inviteToken) return;
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/invite/${inviteToken}`);
        const { name, email, firm_name } = res.data;

        setForm((prev) => ({
          ...prev,
          name,
          email,
          firm_name: firm_name || "",
          role: "client",
          inviteToken,
        }));
      } catch (err) {
        console.error("❌ Invalid invite link", err);
        toast.error("Invalid or expired invite link.");
      }
    };

    fetchInviteData();
  }, [inviteToken]);

  /* ---------------- validators ---------------- */
  const emailOK = (v) => /^\S+@\S+\.\S+$/.test(v.trim());
  const passOK = (v) => v.length >= 8;
  const validate = ({ name, email, password, role, firm_name }) => {
    const e = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!emailOK(email)) e.email = "Enter a valid email.";
    if (!passOK(password)) e.password = "Min 8 characters.";
    if (["admin", "lawyer"].includes(role) && !firm_name.trim())
      e.firm_name = "Firm name is required for admin/lawyer.";
    return e;
  };

  /* ---------------- handlers ---------------- */
  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    setErrors(validate(next));
  };

  const handleRegister = async () => {
    const currentErrors = validate(form);
    if (Object.keys(currentErrors).length) {
      setErrors(currentErrors);
      toast.error("Please fix the highlighted errors.");
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, form);
      toast.success("Registered! Redirecting to login…");
      setTimeout(
        () =>
          typeof goToLogin === "function" ? goToLogin() : window.location.reload(),
        1500
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Registration failed");
    }
  };

  /* ---------------- dynamic inline bits ---------------- */
  const inputStyle = (bad) => ({
    width: "100%",
    padding: "0.75rem",
    marginBottom: "1rem",
    borderRadius: "8px",
    border: `1px solid ${bad ? "#e74c3c" : "#ccc"}`,
    fontSize: "1rem",
    boxSizing: "border-box",
  });
  const errTxt = {
    color: "#e74c3c",
    fontSize: "0.8rem",
    marginTop: "-0.75rem",
    marginBottom: "0.5rem",
  };

  return (
    <div className="register-container">
      <h2 className="register-heading">📝 Register</h2>

      <input
        name="name"
        placeholder="Full Name"
        value={form.name}
        onChange={handleChange}
        style={inputStyle(errors.name)}
        disabled={isInvite}  // Disable if invite token present
      />
      {errors.name && <div style={errTxt}>{errors.name}</div>}

      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        style={inputStyle(errors.email)}
        disabled={isInvite}  // Disable if invite token present
      />
      {errors.email && <div style={errTxt}>{errors.email}</div>}

      <input
        type="password"
        name="password"
        placeholder="Password (min 8 chars)"
        value={form.password}
        onChange={handleChange}
        style={inputStyle(errors.password)}
      />
      {errors.password && <div style={errTxt}>{errors.password}</div>}

      <label style={{ fontWeight: "bold" }}>Role:</label>
      <select
        name="role"
        value={form.role}
        onChange={handleChange}
        style={inputStyle(errors.role)}
      >
        <option value="client">Client</option>
        <option value="lawyer">Lawyer</option>
        <option value="admin">Admin / Firm Head</option>
      </select>

      <label style={{ fontWeight: "bold" }}>
        Firm Name {form.role === "client" ? "(optional)" : "(required)"}
      </label>
      <input
        name="firm_name"
        placeholder="e.g. Bright Legal LLP"
        value={form.firm_name}
        onChange={handleChange}
        style={inputStyle(errors.firm_name)}
        disabled={isInvite}
      />
      {errors.firm_name && <div style={errTxt}>{errors.firm_name}</div>}

      <button className="register-btn" onClick={handleRegister}>
        ➕ Register
      </button>
      <p>
        Already have an account?{" "}
        <span
          className="link-button"
          onClick={() => {
            const loginButton = document.querySelector('.nav-links button:nth-child(1)');
            if (loginButton) {
              loginButton.click();
            } else {
              console.warn("Login button not found in the navigation bar.");
            }
          }}
          style={{
            textDecoration: 'underline',
            cursor: 'pointer',
            color: '#3498db',
          }}
        >
          Login here
        </span>
      </p>

    </div>
  );
}

export default Register;
