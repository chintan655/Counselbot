import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

function NotesSection({ clientId }) {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [doc, setDoc] = useState("");
  const [clientInfo, setClientInfo] = useState(null);
  const [docSaved, setDocSaved] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState("");

  const fetchNotes = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/notes/byClient/${clientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotes(res.data);
  };

  const fetchClientInfo = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const client = res.data.find((c) => c.id === clientId);
    setClientInfo(client);
  };

  const addNote = async () => {
    if (!note.trim()) {
      toast.error("Note can't be empty!");
      return;
    }

    const token = localStorage.getItem("token");

    if (editingNoteId) {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/notes/edit/${editingNoteId}`,
        { note_text: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingNoteId(null);
    } else {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/notes/add`,
        { client_id: clientId, note_text: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    setNote("");
    fetchNotes();
  };

  const editNote = (id, text) => {
    setNote(text);
    setEditingNoteId(id);
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`${process.env.REACT_APP_API_URL}/api/notes/delete/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotes();
  };

  const generateDoc = async () => {
    if (!clientInfo || notes.length === 0) {
      toast.error("Client info or notes missing");
      return;
    }

    const todayDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const content = `Generate an official legal document based on the following client info and notes:
      Client: ${clientInfo.name}, ${clientInfo.email}, ${clientInfo.phone}
      Notes: ${notes.map((n) => `- ${n.note_text}`).join("\n")} , Your response should be realistic, with current legal formatting and today's date: ${todayDate} ,
      You are a legal document drafting assistant. Output should be in professional plain text — no markdown (*, **, #, etc.).
      Use clean spacing, uppercase for headers, and legal formatting.`;

    const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/generate`, { content });

    setDoc(res.data.text);

    await axios.post(
      `${process.env.REACT_APP_API_URL}/api/documents/save`,
      {
        client_id: clientId,
        doc_type: "Custom Document",
        content: res.data.text,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    setGeneratedDoc(res.data.text);
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");

    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/documents/save`,
      {
        client_id: clientId,
        doc_type: "Custom Document",
        content: generatedDoc,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.success) {
      toast.success("📄 Document saved successfully!");
      setDocSaved(true);
    }
  };

  // const downloadPDF = () => {
  //   const pdf = new jsPDF();
  //   pdf.text(doc, 10, 10);
  //   pdf.save(`${clientInfo?.name}_document.pdf`);
  // };
  const downloadPDF = () => {
    if (!doc) return;

    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 10;
    const lineHeight = 10;
    const usableWidth = 190; // For A4 size paper (210mm - 2*margin)

    // Wrap text to fit page width
    const lines = pdf.splitTextToSize(doc, usableWidth);

    let y = margin;
    lines.forEach((line) => {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    });

    const fileName = `${clientInfo?.name || "client"}_document.pdf`;
    pdf.save(fileName);
  };


  useEffect(() => {
    fetchNotes();
    fetchClientInfo();
    // eslint-disable-next-line
  }, [clientId]);

  const styles = {
    container: {
      background: "#fff",
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      marginTop: "1.5rem",
    },
    textarea: {
      width: "100%",
      padding: "0.75rem",
      borderRadius: "8px",
      border: "1px solid #ccc",
      marginBottom: "1rem",
      resize: "vertical",
    },
    button: {
      padding: "10px 20px",
      border: "none",
      borderRadius: "6px",
      backgroundColor: "#3498db",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "bold",
      marginRight: "10px",
      marginTop: "0.5rem",
    },
    noteList: {
      listStyle: "none",
      padding: 0,
    },
    // noteItem: {
    //   padding: "10px",
    //   backgroundColor: "#f4f4f4",
    //   borderRadius: "6px",
    //   marginBottom: "10px",
    // },
    noteItem: {
      padding: "10px",
      backgroundColor: "#f4f4f4",
      borderRadius: "6px",
      marginBottom: "10px",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    },
    noteHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "5px",
    },

    noteButtons: {
      display: "flex",
      gap: "6px",
    },

    tinyButton: {
      padding: "6px 10px",
      fontSize: "12px",
      borderRadius: "4px",
      border: "none",
      color: "#fff",
      cursor: "pointer",
    },

    smallText: {
      color: "#777",
      fontSize: "12px",
    },
    // docSection: {
    //   whiteSpace: "pre-wrap",
    //   backgroundColor: "#f9f9f9",
    //   padding: "1rem",
    //   borderRadius: "10px",
    //   marginTop: "1.5rem",
    //   border: "1px solid #ddd",
    // },
    docSection: {
      whiteSpace: "pre-wrap",
      backgroundColor: "#f9f9f9",
      padding: "1rem",
      borderRadius: "10px",
      marginTop: "1rem",
      border: "1px solid #ddd",
    },
  };


  return (
    <div style={styles.container}>
      <h4>📝 Notes</h4>
      <textarea
        rows={3}
        placeholder="Write a note..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={styles.textarea}
      />
      <button onClick={addNote} style={styles.button}>
        {editingNoteId ? "Update Note" : "Add Note"}
      </button>

      <ul style={styles.noteList}>
        {/* {notes.map((n) => (
          <li key={n.id} style={styles.noteItem}>
            {n.note_text}
          
            
            <button
              style={{ ...styles.button, backgroundColor: "#f39c12" }} title=" Edit Note"
              onClick={() => editNote(n.id, n.note_text)}
            >
              ✏️
            </button>
            <button
              style={{ ...styles.button, backgroundColor: "#e74c3c" }} title="Delee Note"
              onClick={() => deleteNote(n.id)}
            >
              🗑️ 
            </button>
              <br />
            <small style={styles.smallText}>{new Date(n.created_at).toLocaleString()}</small>
          </li>
        ))} */}
        {notes.map((n) => (
          <li key={n.id} style={styles.noteItem}>
            <div style={styles.noteHeader}>
              <span>{n.note_text}</span>
              <div style={styles.noteButtons}>
                <button
                  style={{ ...styles.tinyButton, backgroundColor: "#f39c12" }}
                  title="Edit Note"
                  onClick={() => editNote(n.id, n.note_text)}
                >
                  ✏️
                </button>
                <button
                  style={{ ...styles.tinyButton, backgroundColor: "#e74c3c" }}
                  title="Delete Note"
                  onClick={() => deleteNote(n.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
            <small style={styles.smallText}>
              {new Date(n.created_at).toLocaleString()}
            </small>
          </li>
        ))}

      </ul>

      <button onClick={generateDoc} style={{ ...styles.button, backgroundColor: "#2ecc71" }}>
        Generate Document
      </button>

      {doc && (
        <>
          <h4>📄 Generated Document</h4>
          <div style={styles.docSection}>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
              {doc}
            </pre>
          </div>
          <button onClick={downloadPDF} style={styles.button}>Download PDF</button>
          <button
            onClick={handleSave}
            style={{ ...styles.button, backgroundColor: "#8e44ad" }}
          >
            Save Document
          </button>
        </>
      )}
    </div>
  );
}

export default NotesSection;
