import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import NotesSection from "./NotesSection";
import FileUploader from "./FileUploader";

function ClientProfile({ clientId, onBack, refreshClients }) {
  const [client, setClient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [files, setFiles] = useState([]);
  const [showDocs, setShowDocs] = useState(false);   // ⬅️ new
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});


  const emailOK = (val) => /^\S+@\S+\.\S+$/.test(val.trim());
  // const phoneOK = (val) => {
  //   const digits = val.replace(/\D/g, "");
  //   if (digits.length === 10) return true;
  //   if (digits.length === 11 && digits.startsWith("0")) return true;
  //   if (digits.length === 12 && digits.startsWith("91")) return true;
  //   return false;
  // };
  const phoneOK = (val) => /^[0-9]{10}$/.test(val.trim());

  const validate = ({ name, email, phone }) => {
    const e = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!emailOK(email)) e.email = "Enter a valid email.";
    if (!phoneOK(phone)) e.phone = "Enter a valid 10-digit Indian mobile number.";
    return e;
  };




  const fetchClient = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const found = res.data.find((c) => c.id === parseInt(clientId));
    setClient(found);
  };

  const fetchDocuments = async () => {
    if (!clientId) return;
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/documents/byClient/${clientId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setDocuments(res.data);
  };


  const fetchFiles = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/byClient/${clientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setFiles(res.data);
  };

  useEffect(() => {
    fetchClient();
    fetchDocuments();
    fetchFiles();
  }, [clientId]);

  const toggleDocs = async () => {
    if (!showDocs) await fetchDocuments(); // fetch fresh on open
    setShowDocs(!showDocs);
  };

  const handleEdit = () => {
    setEditForm({ ...client });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const next = { ...editForm, [e.target.name]: e.target.value };
    setEditForm(next);
    setErrors(validate(next));
  };

  const saveEdit = async () => {
    const currentErrors = validate(editForm);
    if (Object.keys(currentErrors).length) {
      setErrors(currentErrors);              // turn borders red
      toast.error(" Please check your email and phone number before saving.");
      return;                                // ⛔ stop here
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/clients/${clientId}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(" Client updated.");
      setIsEditing(false);
      setErrors({});
      fetchClient();
      refreshClients();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update client.");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setErrors({});
  };



  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this client? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/clients/${clientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Client deleted.");
      refreshClients();
      onBack();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete client.");
    }
  };

  const handleDocDelete = async (docId) => {
    if (!window.confirm("Delete this document forever?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/documents/${docId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Instant UX feedback: remove it locally
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error(err);
      toast.error("Unable to delete document.");
    }
  };


  const handleFileDeleted = () => {
    fetchFiles(); // Refresh file list
  };

  const styles = {
    container: {
      maxWidth: "800px",
      margin: "0 auto",
      backgroundColor: "#fff",
      padding: "2rem",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      marginTop: "2rem",
    },
    section: {
      marginBottom: "2rem",
    },
    label: {
      fontWeight: "bold",
    },
    docList: {
      listStyleType: "none",
      paddingLeft: 0,
    },
    docItem: {
      backgroundColor: "#f8f8f8",
      padding: "1rem",
      borderRadius: "8px",
      marginBottom: "1rem",
    },
    docContent: {
      backgroundColor: "#eee",
      padding: "0.75rem",
      borderRadius: "6px",
      fontFamily: "monospace",
      whiteSpace: "pre-wrap",
      maxHeight: "160px",
      overflowY: "auto",
    },
    button: {
      marginRight: "1rem",
      padding: "0.5rem 1rem",
      borderRadius: "6px",
      cursor: "pointer",
      border: "none",
    },
    deleteDocBtn: { background: "#dc3545", color: "#fff" },
    editBtn: {
      backgroundColor: "#007bff",
      color: "#fff",
    },
    deleteBtn: {
      backgroundColor: "#dc3545",
      color: "#fff",
    },
    backBtn: {
      backgroundColor: "#aaa",
      color: "#fff",
      marginBottom: "1rem",
    },
    fileItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f0f0f0",
      padding: "0.5rem 1rem",
      marginBottom: "0.5rem",
      borderRadius: "6px",
    },
    docItem: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      background: "#ffffff",
      padding: "1.25rem 1.5rem",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      borderLeft: "6px solid #6f42c1",        // purple accent
      transition: "transform 0.2s ease-in-out",
    },
    docItemHover: {
      transform: "translateY(-4px)",
    },
    docHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    badge: {
      background: "#6f42c1",
      color: "#fff",
      borderRadius: "8px",
      padding: "0.25rem 0.75rem",
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "capitalize",
      letterSpacing: "0.3px",
    },
    docMeta: {
      fontSize: "0.8rem",
      color: "#666",
    },
    actionRow: {
      display: "flex",
      gap: "0.75rem",
      justifyContent: "flex-end",
    },
    actionBtn: {
      padding: "0.4rem 0.9rem",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      fontSize: "0.8rem",
    },
    viewBtn: { background: "#0d6efd", color: "#fff" },
    dlBtn: { background: "#198754", color: "#fff" },
    input: {
      width: "90%",
      padding: "0.6rem",
      margin: "0.5rem 0",
      borderRadius: "8px",
      fontSize: "1rem",
    }


  };

  if (!client) return <p>Loading client data...</p>;

  return (
    <div style={styles.container}>
      <button style={{ ...styles.button, ...styles.backBtn }} onClick={onBack}>
        ← Back to Client List
      </button>

      {/* === Profile === */}
      <div style={styles.section}>
        <h2>👤 Client Profile</h2>
        {isEditing ? (
          <>
            <input
              name="name"
              value={editForm.name}
              onChange={handleInputChange}
              placeholder="Name"
              style={{
                ...styles.input,
                border: errors.name ? "1px solid red" : "1px solid #ccc"
              }}
            />
            {errors.name && <div style={{ color: "red", fontSize: "0.8rem" }}>{errors.name}</div>}

            <input
              name="email"
              value={editForm.email}
              onChange={handleInputChange}
              placeholder="Email"
              style={{
                ...styles.input,
                border: errors.email ? "1px solid red" : "1px solid #ccc"
              }}
            />
            {errors.email && <div style={{ color: "red", fontSize: "0.8rem" }}>{errors.email}</div>}

            <input
              name="phone"
              value={editForm.phone}
              onChange={handleInputChange}
              placeholder="Phone"
              style={{
                ...styles.input,
                border: errors.phone ? "1px solid red" : "1px solid #ccc"
              }}
            />
            {errors.phone && <div style={{ color: "red", fontSize: "0.8rem" }}>{errors.phone}</div>}

            <div style={{ marginTop: "0.75rem" }}>
              <button style={{ ...styles.button, backgroundColor: "#28a745", marginBottom: "8px" }} onClick={saveEdit}>
                ✅ Save
              </button>
              <button style={{ ...styles.button, backgroundColor: "#aaa", marginLeft: "1rem" }} onClick={cancelEdit}>
                ❌ Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p><span style={styles.label}>Name:</span> {client.name}</p>
            <p><span style={styles.label}>Email:</span> {client.email}</p>
            <p><span style={styles.label}>Phone:</span> {client.phone}</p>

            <button style={{ ...styles.button, ...styles.editBtn }} onClick={handleEdit}>
              ✏️ Edit
            </button>
          </>
        )}

        <button style={{ ...styles.button, ...styles.deleteBtn }} onClick={handleDelete}>
          🗑️ Delete
        </button>
      </div>

      <hr />

      {/* === Notes === */}
      <div style={styles.section}>
        <NotesSection clientId={parseInt(clientId)} />
      </div>

      <hr />

      {/* === Show/Hide Docs Button === */}
      <button
        style={{ ...styles.button, backgroundColor: "#28a745", color: "#fff" }}
        onClick={toggleDocs}
      >
        {showDocs ? "Hide Documents" : "Show Documents"}
      </button>

      {/* === Docs (conditional) === */}
      {showDocs && (
        <div style={styles.section}>
          <h4>📂 Documents</h4>
          <ul style={styles.docList}>
            {documents.map((doc) => (
              // <li key={doc.id} style={styles.docItem}>
              //   <strong>{doc.doc_type}</strong> –{" "}
              //   {new Date(doc.created_at).toLocaleString()}
              //   <div style={styles.docContent}>
              //     {doc.content.slice(0, 300)}...
              //   </div>
              // </li>
              <li key={doc.id} style={styles.docItem}>
                <div style={styles.docHeader}>
                  <div>
                    <strong>{doc.doc_type}</strong>{" "}
                    <span style={styles.docMeta}>
                      — {new Date(doc.created_at).toLocaleString()}
                    </span>
                  </div>

                  {/* 🗑️  Delete */}
                  <button
                    style={{ ...styles.actionBtn, ...styles.deleteDocBtn }} title="Delete Document"
                    onClick={() => handleDocDelete(doc.id)}
                  >
                    🗑️
                  </button>
                </div>

                <div style={styles.docContent}>{doc.content}...</div>
              </li>

            ))}
          </ul>
        </div>
      )}

      <hr />

      {/* === File Uploader === */}
      <div style={styles.section}>
        <FileUploader
          clientId={clientId}
          onUploadComplete={fetchFiles}
          onFileDeleted={handleFileDeleted}
        />
      </div>
    </div>
  );
}

export default ClientProfile;
