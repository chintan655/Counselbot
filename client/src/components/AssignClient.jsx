import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AssignClient() {
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);
  const [lawyerId, setLawyerId] = useState("");
  const [clientId, setClientId] = useState("");
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // 🧠 Track screen resize for responsive logic
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🧠 Responsive style logic based on screen width
  const getBoxStyle = () => {
    let width = "90%";
    if (screenWidth > 3840) width = "700px";
    else if (screenWidth > 3000) width = "1200px";
    else if (screenWidth > 1600) width = "600px";
    else if (screenWidth > 1200) width = "550px";
    else if (screenWidth > 1024) width = "500px";
    else if (screenWidth > 768) width = "460px";
    else if (screenWidth > 640) width = "420px";
    else width = "95%";

    return {
      background: "#fff",
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      maxWidth: width,
      margin: "2rem auto",
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get(`${process.env.REACT_APP_API_URL}/api/users/lawyers`, { headers })
      .then((res) => setLawyers(res.data))
      .catch(() => toast.error("Failed to load lawyers"));

    axios
      .get(`${process.env.REACT_APP_API_URL}/api/clients/my`, { headers })
      .then((res) => setClients(res.data))
      .catch(() => toast.error("Failed to load clients"));
  }, []);

  const assign = () => {
    if (!lawyerId || !clientId)
      return toast.error("Pick both client & lawyer");
    const token = localStorage.getItem("token");
    axios
      .post(
        `${process.env.REACT_APP_API_URL}/api/clients/assign`,
        { client_id: clientId, lawyer_id: lawyerId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => toast.success("Client assigned 🎉"))
      .catch((err) =>
        toast.error(err.response?.data?.error || "Error assigning")
      );
  };

  return (
    <div style={getBoxStyle()}>
      <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>
        👑 Assign Client to Lawyer
      </h3>

      <label>Client:</label>
      <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
      >
        <option value="">-- select client --</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <label>Lawyer:</label>
      <select
        value={lawyerId}
        onChange={(e) => setLawyerId(e.target.value)}
        style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
      >
        <option value="">-- select lawyer --</option>
        {lawyers.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      <button
        onClick={assign}
        style={{
          padding: "10px 18px",
          background: "#4a90e2",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          width: "100%",
          cursor: "pointer",
        }}
      >
        Assign
      </button>
    </div>
  );
}
