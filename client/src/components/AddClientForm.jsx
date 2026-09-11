import React from "react";
import { useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../AuthContext";

function AddClientForm({ onAdd }) {
  
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});   // 🆕 hold field‑level errors

  /* ------------------ helpers ------------------ */
  const emailOK = (val) => /^\S+@\S+\.\S+$/.test(val);

  // ✔️ Accepts 9876543210, 09876543210, or +91‑9876543210
  // const phoneOK = (val) => {
  //   const digits = val.replace(/\D/g, "");         // strip spaces, dashes, +, etc.
  //   if (digits.length === 10) return true;         // plain 10‑digit
  //   if (digits.length === 11 && digits.startsWith("0")) return true;  // leading 0
  //   return false;                                  // anything else = nope
  // };
  const phoneOK = (val) => /^[0-9]{10}$/.test(val.trim());


  const validate = ({ name, email, phone }) => {
    const e = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!emailOK(email)) e.email = "Enter a valid email (e.g. me@example.com).";
    if (!phoneOK(phone)) e.phone = "Enter a valid 10-digit Indian mobile number.";
    return e;
  };

  /* ---------------- handlers ---------------- */
  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    setErrors(validate(next)); // live validation
  };

  const { user } = useContext(AuthContext);
if (user?.role === "client") return null; 

  const addClient = async () => {

    const currentErrors = validate(form);
    if (Object.keys(currentErrors).length) {
      setErrors(currentErrors);
      toast.error("Fix the highlighted errors before submitting.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/clients/add`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(" Client added!");
      setForm({ name: "", email: "", phone: "" });
      setErrors({});
      onAdd();      // refresh parent list
    } catch {
      toast.error("Server error while adding client.");
    }
  };

  /* ---------------- styles ---------------- */
  const styles = {
    container: {
      backgroundColor: "#ffffff",
      padding: "1rem",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      marginBottom: "2rem",
    },
    input: (hasError) => ({
      width: "90%",
      padding: "0.6rem",
      margin: "0.5rem 0",
      borderRadius: "8px",
      border: `1px solid ${hasError ? "#e74c3c" : "#ccc"}`, // 🔴 red on error
      fontSize: "1rem",
    }),
    errorText: { color: "#e74c3c", fontSize: "0.8rem", marginTop: "-0.25rem" },
    button: {
      padding: "0.6rem 1.2rem",
      backgroundColor: "#27ae60",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontWeight: "bold",
      cursor: "pointer",
      marginTop: "0.5rem",
    },
    heading: {
      fontSize: "1.25rem",
      marginBottom: "0.5rem",
    },
  };

  /* ---------------- render ---------------- */
  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>➕ Add New Client</h3>

      <input
        name="name"
        placeholder="Client Name"
        onChange={handleChange}
        value={form.name}
        style={styles.input(errors.name)}
      />
      {errors.name && <div style={styles.errorText}>{errors.name}</div>}

      <input
        name="email"
        placeholder="Email Address"
        onChange={handleChange}
        value={form.email}
        style={styles.input(errors.email)}
      />
      {errors.email && <div style={styles.errorText}>{errors.email}</div>}

      <input
        name="phone"
        placeholder="Phone Number"
        onChange={handleChange}
        value={form.phone}
        style={styles.input(errors.phone)}
      />
      {errors.phone && <div style={styles.errorText}>{errors.phone}</div>}

      <button onClick={addClient} style={styles.button}>
        ➕ Add Client
      </button>
    </div>
  );
}

export default AddClientForm;
