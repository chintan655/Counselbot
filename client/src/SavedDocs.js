import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import "./fonts/NotoDev-normal.js";   // Hindi
import "./fonts/NotoGuj-normal.js";   // Gujarati



function SavedDocs() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);



  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/documents/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDocuments(res.data);
      } catch (err) {
        console.error("Error fetching docs:", err.message);
      }
    };

    fetchDocs();
  }, []);

  const handleDelete = async (docId) => {
    if (!window.confirm("Trash this doc forever?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/documents/${docId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // instant UI feedback: strip it from local state
      setDocuments((prev) => prev.filter((d) => d.id !== docId));

      // clear viewer if you deleted the one that was open
      if (selectedDoc && selectedDoc.id === docId) {
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error("Delete failed:", err.message);
      toast.error("Couldn't delete—check console.");
    }
  };


  const detectLang = (text) => {
    if (/[\u0A80-\u0AFF]/.test(text)) return "gu";  // Gujarati Unicode block
    if (/[\u0900-\u097F]/.test(text)) return "hi";  // Devanagari block (Hindi)
    return "en"; // default to English
  };

  const downloadPDF = () => {
    if (!selectedDoc || !selectedDoc.content) return;

    const text = selectedDoc.content;
    const lang = detectLang(text);

    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const lineHeight = 10;
    const margin = 10;
    const maxLineWidth = 190;

    // 👇 Set the correct font based on language
    if (lang === "hi") {
      pdf.setFont("NotoSansDevanagari-Regular");
    } else if (lang === "gu") {
      pdf.setFont("NotoSansGujarati-Regular"); // Gujarati font 
    } else {
      pdf.setFont("helvetica"); // default English font
    }

    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(text, maxLineWidth);

    let y = margin;
    lines.forEach(line => {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    });

    const filename = `${selectedDoc.doc_type || "document"}.pdf`;
    pdf.save(filename);
  };

  const styles = {
    container: {
      maxWidth: "80%",
      // maxWidth: "800px",
      margin: "auto",
      padding: "2rem",
    },
    docList: {
      listStyle: "none",
      padding: 0,
    },

    docItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "1rem",
      marginBottom: "1rem",
      backgroundColor: "#fdfdfd",
      transition: "0.2s",
    },
    smallDelBtn: {
      backgroundColor: "#dc3545",
      color: "white",
      border: "none",
      borderRadius: "4px",
      padding: "4px 8px",
      fontSize: "0.75rem",
      cursor: "pointer",
      marginLeft: "1rem",
    },

    selectedBox: {
      backgroundColor: "#f9f9f9",
      padding: "1rem",
      borderRadius: "10px",
      marginTop: "2rem",
      border: "1px solid #ccc",
    },
    button: {
      padding: "0.6rem 1rem",
      marginTop: "1rem",
      backgroundColor: "#2e86de",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <h2>📁 Your Saved Legal Documents</h2>

      {documents.length === 0 ? (
        <p>❌ No documents found.</p>
      ) : (
        <ul style={styles.docList}>
          {documents.map((doc) => (

            <li key={doc.id} style={styles.docItem}>
              <div onClick={() => setSelectedDoc(doc)} style={{ cursor: "pointer" }}>
                <strong>{doc.doc_type}</strong> — {doc.client_name || "No Client Linked"}<br />
                <small>{new Date(doc.created_at).toLocaleString()}</small>
              </div>

              <button
                style={styles.smallDelBtn} title="Delete Document"
                onClick={() => handleDelete(doc.id)}
              >
                🗑️
              </button>
            </li>


          ))}
        </ul>
      )}

      {selectedDoc && (
        <div style={styles.selectedBox}>
          <h3>📄 {selectedDoc.doc_type}</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
            {selectedDoc.content}
          </pre>
          <button onClick={downloadPDF} style={styles.button}>
            ⬇️ Download as PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default SavedDocs;
