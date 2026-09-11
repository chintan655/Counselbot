import React from "react";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";


function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const chatRef = useRef(null);
  const [hoveredChat, setHoveredChat] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [loading, setLoading] = useState(false);


  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // 🔊 VOICE: state + ref
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [hoveredPin, setHoveredPin] = useState(null);

  // 🔊 VOICE: init SpeechRecognition once
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = "en-IN";          // tweak if you need Hindi/Gujarati later
    recog.continuous = false;
    recog.interimResults = false;

    recog.onstart = () => setIsListening(true);
    recog.onend = () => setIsListening(false);
    recog.onerror = (e) => console.error("Voice error:", e);

    recog.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      // append to whatever’s already typed
      setInput((prev) => (prev ? prev + " " : "") + spoken);
    };

    recognitionRef.current = recog;
  }, []);

  const handleMicClick = () => {
    const recog = recognitionRef.current;
    if (!recog) {
      toast.error("Your browser doesn't support voice input 😢");
      return;
    }
    isListening ? recog.stop() : recog.start();
  };

  // ————————— EXISTING LOGIC BELOW —————————
  const saveToDoc = async (text) => {
    const token = localStorage.getItem("token");
    const docType = prompt("Enter document title/type:");
    if (!docType) return;

    await axios.post(
      `${process.env.REACT_APP_API_URL}/api/documents/save-from-chat`,
      { docType, content: text },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success(" Saved as document!");
  };

  const [uploadedFileText, setUploadedFileText] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/chat/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // 1. Show file name as a "user message"
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: `📎 Uploaded: ${file.name}`,
        },
      ]);

      // 2. Store file content in memory, not in chat
      setUploadedFileText(res.data.text);
      toast.success(`📁 ${file.name} uploaded`);
    } catch (err) {
      console.error(err);
      toast.error("File upload failed.");
    }
  };




  const deleteChat = async (id) => {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/chat/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("🗑️ Chat deleted");
      if (sessionId === id) {
        setMessages([]);
        setSessionId(null);
      }
      loadSessions();
    } catch (err) {
      console.error("Delete failed", err);
      toast.error(" Failed to delete chat");
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setLastMessage(null);
  };

  //   const sendMessage = async (msg = input) => {
  //     if (!msg?.trim()) return;

  //     const userMsg = { role: "user", text: msg };
  //     setMessages((prev) => [...prev, userMsg]);
  //     setLastMessage(msg);
  //     setInput("");
  //     setLoading(true);          // 🔄 start spinner

  //     try{
  //     const token = localStorage.getItem("token");
  //     const res = await axios.post(
  //       "${process.env.REACT_APP_API_URL}/api/chat",
  //       {
  //         message: msg,
  //         history: messages.map((m) => ({ from: m.role, text: m.text })),
  //         sessionId,
  //       },
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );

  //     const botMsg = { role: "bot", text: res.data.response };
  //     setMessages((prev) => [...prev, botMsg]);

  //     if (!sessionId && res.data.sessionId) {
  //       setSessionId(res.data.sessionId);
  //       setSessions((prev) => [
  //         {
  //           id: res.data.sessionId,
  //           title: msg.slice(0, 30) || "Untitled Chat",
  //           created_at: new Date().toISOString(),
  //           client_name: null,
  //           is_pinned: false,
  //         },
  //         ...prev,
  //       ]);
  //     }
  //    } catch (err) {
  //     console.error(err);
  //     toast.error("😬 Something blew up, try again.");
  //   } finally {
  //     setLoading(false);       // 🛑 stop spinner
  //   }
  // };
  const sendMessage = async (msg = input) => {
    if (!msg?.trim()) return;

    const userMsg = { role: "user", text: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLastMessage(msg);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/chat`,
        {
          message: msg,
          history: messages.map((m) => ({ from: m.role, text: m.text })),
          sessionId,
          fileText: uploadedFileText  // 🧠 send file context to backend
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const botMsg = { role: "bot", text: res.data.response };
      setMessages((prev) => [...prev, botMsg]);

      if (!sessionId && res.data.sessionId) {
        setSessionId(res.data.sessionId);
        setSessions((prev) => [
          {
            id: res.data.sessionId,
            title: msg.slice(0, 30) || "Untitled Chat",
            created_at: new Date().toISOString(),
            client_name: null,
            is_pinned: false,
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error(err);
      toast.error("😬 Something went wrong.");
    } finally {
      setLoading(false);
    }
  };


  const loadSessions = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/chat/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSessions(res.data);
  };

  const loadSession = async (id) => {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/chat/sessions/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setSessionId(id);
    setMessages(
      res.data.map((m) => ({
        role: m.role === "user" ? "user" : "bot",
        text: m.text,
      }))
    );

    setOpenMenuId(null);
    setHoveredChat(null);

    // 👇 Scroll to top of chat
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = 0;
      }
    }, 100);
  };

  const renameChat = async (id) => {
    const newTitle = prompt("Enter new chat title:");
    if (!newTitle?.trim()) return;

    const token = localStorage.getItem("token");
    await axios.put(
      `${process.env.REACT_APP_API_URL}/api/chat/sessions/${id}/rename`,
      { newTitle },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const togglePin = async (id, currentStatus) => {
    const token = localStorage.getItem("token");

    const { data } = await axios.put(
      `${process.env.REACT_APP_API_URL}/api/chat/sessions/${id}/pin`,
      { is_pinned: !currentStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_pinned: data.is_pinned } : s))
    );
  };

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const topStuff = isMobile ? 200 : 250;
  const widthStuff = isMobile ? 400 : 50;
  const styles = {
    container: {
      display: isMobile ? "block" : "flex",
      maxWidth: isMobile ? "95%" : "80%",
      margin: isMobile ? "1rem auto" : "2rem auto",
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    sidebar: {
      width: isMobile ? "100%" : "280px",
      backgroundColor: "#f7f7f8",
      borderRight: isMobile ? "none" : "1px solid #e0e0e0",
      height: "100vh",
      overflowY: "auto",
      padding: "1rem",
      boxShadow: isMobile ? "none" : "2px 0 8px rgba(0,0,0,0.05)",
      transition: "all 0.3s ease-in-out",
    },
    chatItem: {
      padding: "10px 12px",
      borderRadius: "8px",
      marginBottom: "8px",
      backgroundColor: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: "1px solid #eaeaea",
    },
    chatItemHover: {
      backgroundColor: "#e6f0ff",
      transform: "scale(1.02)",
    },
    chatTitle: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: "0.95rem",
      fontWeight: 500,
      color: "#333",
    },
    chatActions: {
      display: "flex",
      gap: "0.4rem",
    },
    newChatBtn: {
      width: "100%",
      marginTop: "1rem",
      marginBottom: "1rem",
      padding: "0.75rem",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#10a37f",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      fontSize: "0.95rem",
    },

    //     chatSection: {
    //       flex: 1,
    //       padding: "1.5rem",
    //       width: isMobile ? "100%" : "auto",
    //       // maxHeight: "40%",
    //        height: `calc(100dvh - ${topStuff}px)`,
    //     },
    //     chatBox: {
    //       // maxHeight: "40%",
    //        height: `calc(100dvh - ${topStuff}px)`,
    //       // maxHeight: "400px",
    //       overflowY: "auto",
    //       marginBottom: "1rem",
    //       padding: "0.5rem",
    //       border: "1px solid #ddd",
    //       borderRadius: "8px",
    //       backgroundColor: "#fefefe",
    //     },

    /* 1️⃣  CHAT SECTION — make it a column flex container */
    chatSection: {
      display: "flex",
      flexDirection: "column",
      height: "100dvh",     // full device height, safe on mobile
      width: isMobile ? "100%" : "auto",
      padding: "1.5rem",
      boxSizing: "border-box",   // include padding in height calc
      paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
      position: "relative",
    },

    /* 2️⃣  CHAT BOX — flex-grow so it takes *only* leftover space */
    chatBox: {
      flex: 1,                 // 💥 the magic line
      overflowY: "auto",
      marginBottom: "1rem",
      padding: "0.5rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      backgroundColor: "#fefefe",
      maxWidth: "100%",
      width: `calc(100dvh - ${widthStuff}px)`,
      wordBreak: "break-word",
    },



    messageBubble: (isUser) => ({
      textAlign: isUser ? "right" : "left",
      marginBottom: "0.5rem",
    }),
    bubbleContent: (isUser) => ({
      display: "inline-block",
      background: isUser ? "#daf1ff" : "#f1f1f1",
      padding: "0.75rem 1rem",
      borderRadius: "12px",
      maxWidth: "70%",
      fontSize: "0.95rem",
    }),
    inputArea: {
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
      marginBottom: "0.5rem",
      width: "100%",
      flexWrap: "wrap",
    },
    input: {
      flex: 1,
      minWidth: 0,
      padding: "0.5rem 0.75rem",
      fontSize: "1rem",
      borderRadius: "8px",
      border: "1px solid #ccc",
    },
    button: {
      padding: "0.5rem 1rem",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#3498db",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      flexShrink: 0,
    },
    actionBtn: {
      marginTop: "10px",
      padding: "0.5rem 1rem",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#2ecc71",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
    },
    micBtn: {
      padding: "0.5rem 0.7rem",
      borderRadius: "50%",
      border: "none",
      backgroundColor: isListening ? "#e74c3c" : "#27ae60",
      color: "#fff",
      fontSize: "1rem",
      cursor: "pointer",
      flexShrink: 0,
    },

    ellipsisBtn: {
      width: 24,
      height: 24,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: "1.2rem"
    },
    menuPop: {
      position: "absolute",
      top: 32,
      right: 8,
      background: "#fff",
      border: "1px solid #e0e0e0",
      borderRadius: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      zIndex: 99,
      padding: "6px 0",
      width: 140
    },

    clipBtn: {
      fontSize: "1.4rem",
      cursor: "pointer",
      marginRight: "0.5rem",
      color: "#555",
      userSelect: "none",
    },


    menuItem: {
      display: "flex",
      alignItems: "center",
      width: "100%",
      padding: "6px 12px",
      background: "transparent",
      border: "none",
      fontSize: "0.85rem",
      cursor: "pointer",
      textAlign: "left",
    },

    loaderOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(255,255,255,0.7)",
      backdropFilter: "blur(1.5px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "8px",   // matches chat box corners
      zIndex: 10,
    },

    spinner: {
      width: 32,
      height: 32,
      border: "4px solid #3498db",
      borderTopColor: "transparent",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    },


  };

  const Loader = () => (
    <div style={styles.loaderOverlay}>
      <div style={styles.spinner} />
      <span style={{ marginTop: 8 }}>Thinking…</span>
    </div>
  );


  return (
    <div style={styles.container}>
      {/* ——— Sidebar ——— */}
      <div style={styles.sidebar}>
        <h3 style={{ marginBottom: "1rem" }}>🕘 Chat History</h3>
        <button style={styles.newChatBtn} onClick={startNewChat}>
          {/* ✨ Start New Chat */}
          💬 Start New Chat
        </button>
        {sessions.map((s) => (
          <div
            key={s.id}
            style={{
              ...styles.chatItem,
              ...(hoveredChat === s.id ? styles.chatItemHover : {}),
            }}
            onMouseEnter={() => setHoveredChat(s.id)}
            onMouseLeave={() => setHoveredChat(null)}
          >
            <span
              style={styles.chatTitle}
              onClick={() => loadSession(s.id)}
              title={"open this chat"}
            >
              📄 {s.title || "Untitled Chat"}
            </span>

            <button
              style={styles.ellipsisBtn}
              onClick={() => toggleMenu(s.id)}
            >
              ⋯
            </button>
            {openMenuId === s.id && (
              <div style={styles.menuPop}>
                <button style={styles.menuItem} onClick={() => { renameChat(s.id); toggleMenu(null); }}>✏️ Rename</button>
                <button style={styles.menuItem} onClick={() => { togglePin(s.id, s.is_pinned); toggleMenu(null); }}>
                  {s.is_pinned ? "📍 Un-pin" : "📌 Pin"}
                </button>
                <button style={{ ...styles.menuItem, color: "red" }} onClick={() => { deleteChat(s.id); toggleMenu(null); }}>
                  ❌ Delete
                </button>
              </div>
            )}
          </div>
        ))}



      </div>

      {/* ——— Chat Section ——— */}
      <div style={styles.chatSection}>
        <h3>💬 Legal Chatbot</h3>
        <div style={styles.chatBox}>
          {messages.map((msg, index) => (
            <div key={index} style={styles.messageBubble(msg.role === "user")}>
              <div style={styles.bubbleContent(msg.role === "user")}>
                <strong>{msg.role === "user" ? "You" : "Bot"}:</strong>{" "}
                {msg.role === "bot" ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text.startsWith("📎 Uploaded:") ? (
                    <span>
                      <span role="img" aria-label="paperclip">📎</span>{" "}
                      {msg.text.replace("📎 Uploaded:", "").trim()}
                    </span>
                  ) : (
                    msg.text
                  )

                )}
              </div>

            </div>
          ))}
          <div ref={chatRef} />
          {loading && <Loader />}

        </div>

        {/* Input row */}
        <div style={styles.inputArea}>
          {/* 📎 file button */}
          <label htmlFor="file-upload" style={styles.clipBtn}>
            📎
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />

          {/* text input */}
          <input
            type="text"
            value={input}
            placeholder="Ask about any legal topic..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            style={styles.input}
          />

          {/* 🔊 VOICE BTN */}
          <button onClick={handleMicClick} style={styles.micBtn}>
            {isListening ? "⏹️" : "🎤"}
          </button>
          {/* send button */}
          <button onClick={() => sendMessage(input)} style={styles.button}>
            Send
          </button>
        </div>

        {lastMessage && (
          <button
            onClick={() => sendMessage(lastMessage)}
            style={{ ...styles.actionBtn, backgroundColor: "#f39c12" }}
          >
            🔄 Regenerate Response
          </button>
        )}

        {messages.length > 0 &&
          messages[messages.length - 1].role === "bot" && (
            <button
              onClick={() => saveToDoc(messages[messages.length - 1].text)}
              style={{ ...styles.actionBtn, backgroundColor: "#9b59b6" }}
            >
              📄 Save as Document
            </button>
          )}
      </div>
    </div>
  );
}

export default Chatbot;
