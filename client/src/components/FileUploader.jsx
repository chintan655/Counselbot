import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

function FileUploader({ clientId = null }) {
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const token = localStorage.getItem("token");

  const fetchFiles = async () => {
    try {
      const res = clientId
        ? await axios.get(`${process.env.REACT_APP_API_URL}/api/files/byClient/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        : await axios.get(`${process.env.REACT_APP_API_URL}/api/files/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

      setUploadedFiles(res.data);
    } catch (err) {
      console.error("Fetch files error:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [clientId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Select a file first");

    const formData = new FormData();
    formData.append("file", file);
    if (clientId) formData.append("clientId", clientId);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/files/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setFile(null);
      fetchFiles();
      toast.success(" File uploaded");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/files/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFiles();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete file");
    }
  };

  const styles = {
    container: {
      marginTop: "2rem",
      background: "#fff",
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    },
    heading: {
      fontSize: "1.2rem",
      marginBottom: "1rem",
      fontWeight: "600",
    },
    form: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      marginBottom: "1rem",
    },
    fileInput: {
      padding: "6px",
      borderRadius: "6px",
      border: "1px solid #ccc",
      flex: 1,        // grow to take leftover space
      minWidth: 0,
    },
    uploadBtn: {
      backgroundColor: "#2ecc71",
      color: "#fff",
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "bold",
      flexShrink: 0,
    },
    fileList: {
      listStyleType: "none",
      padding: 0,
      marginTop: "1rem",
    },
    fileItem: {
      padding: "0.75rem",
      borderBottom: "1px solid #eee",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "0.5rem",
    },
    fileName: {
      fontWeight: "500",
      flex: 1,
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    },
    actions: {
      display: "flex",
      gap: "0.75rem",
      flexShrink: 0,
    },
    deleteBtn: {
      background: "transparent",
      border: "none",
      color: "#e74c3c",
      cursor: "pointer",
      fontWeight: "bold",
    },
    downloadLink: {
      textDecoration: "none",
      color: "#3498db",
      fontWeight: "bold",
    },
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.heading}>
        {clientId ? "📎 Client Files" : "📁 My Personal Files"}
      </h4>

      <form style={styles.form} onSubmit={handleUpload}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={styles.fileInput}
        />
        <button type="submit" style={styles.uploadBtn}>
          ⬆️ Upload
        </button>
      </form>

      <ul style={styles.fileList}>
        {uploadedFiles.map((f) => (
          <li key={f.id} style={styles.fileItem}>
            <span style={styles.fileName}>📄 {f.original_name}</span>
            <span style={styles.actions}>

              <a
                href={`${process.env.REACT_APP_API_URL}/${f.file_path.replace(/^\/?/, '')}`}
                // download
                target="_blank"
                rel="noopener noreferrer"
                style={styles.downloadLink} title="Download"
              >
                ⬇️ Download
              </a>
              <button onClick={() => handleDelete(f.id)} style={styles.deleteBtn} title="Delete" >
                ❌ Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileUploader;
