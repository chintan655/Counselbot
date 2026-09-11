// /client/src/components/ClientHome.jsx
import React from "react";

export default function ClientHome({ setPage }) {
  const box = {
    flex: 1,
    minWidth: "150px",
    padding: "1.25rem",
    margin: "0.5rem",
    borderRadius: "12px",
    background: "#f4f8ff",
    textAlign: "center",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    fontWeight: "bold",
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h3 style={{ marginBottom: "1rem" }}>🚀 Quick Actions</h3>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <div style={box} onClick={() => setPage("chatbot")}>
          💬 Chat with AI
        </div>
        <div style={box} onClick={() => setPage("generate")}>
          📄 Generate Document
        </div>
        <div style={box} onClick={() => setPage("file_uploader")}>
          📂 My Files
        </div>
      </div>
    </div>
  );
}
