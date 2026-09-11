import React, {
  useState,
  useEffect,
  useRef,
  useContext,
} from "react";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { AuthContext } from "../AuthContext";

export default function MyLawyerChat() {
  const { user } = useContext(AuthContext);
  const [convo, setConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const token = localStorage.getItem("token");
  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  /* ── fetch conversation + messages on mount ─────────────────────── */
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/lc/conversations`, authHeader)
      .then((res) => {
        if (res.data.length) {
          setConvo(res.data[0]);
          return axios.get(
            `${process.env.REACT_APP_API_URL}/api/lc/messages/${res.data[0].id}`,
            authHeader
          );
        }
      })
      .then((r) => r && setMessages(r.data))
      .catch((err) => console.error(err));
  }, []);

  /* autoscroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── helpers ────────────────────────────────────────────────────── */
  const formatTime = (time) =>
    new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const pushMessage = (msg) =>
    setMessages((prev) => [...prev, msg]);

  /* ── send text message ──────────────────────────────────────────── */
  const send = () => {
    if (!input.trim() || !convo) return;
    axios
      .post(
        `${process.env.REACT_APP_API_URL}/api/lc/client/send`,
        { lawyer_id: convo.lawyer_id, text: input },
        authHeader
      )
      .then(() => {
        pushMessage({
          sender_type: "client",
          text: input,
          sent_at: new Date(),
        });
        setInput("");
        setShowEmoji(false);
      })
      .catch((e) => console.error(e));
  };

  /* ── upload file ────────────────────────────────────────────────── */
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !convo) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversation_id", convo.id);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/lc/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.success) {
        /* append message locally */
        pushMessage({
          sender_type: "client",
          text: res.data.file, // "/chat_files/xyz.pdf"
          sent_at: new Date(),
        });
      }
    } catch (err) {
      console.error("File upload error", err.response?.data || err);
    } finally {
      e.target.value = ""; // clear picker
    }
  };

  /* ── handle typing indicator ────────────────────────────────────── */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    } else {
      if (!typing) setTyping(true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTyping(false), 2000);
    }
  };

  /* ── emoji click ────────────────────────────────────────────────── */
  const onEmojiClick = (emojiData) =>
    setInput((prev) => prev + emojiData.emoji);

  if (!convo) {
    return (
      <div
        style={{
          background: "#fff",
          padding: "1rem",
          borderRadius: 12,
          maxWidth: 600,
          margin: "1rem auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <p>🕒 Waiting for your lawyer to send the first message...</p>
        <p style={{ fontSize: "0.9rem", color: "#666" }}>
          You can’t start a chat until they initiate the conversation.
        </p>
      </div>
    );
  }


  /* ── message renderer ───────────────────────────────────────────── */
  const renderContent = (text) => {
    if (text.startsWith("/chat_files/")) {
      const url = `${process.env.REACT_APP_API_URL}${text}`;
      const ext = text.split(".").pop().toLowerCase();
      if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
        return (
          <a href={url} target="_blank" rel="noreferrer">
            <img
              src={url}
              alt="upload"
              style={{ maxWidth: 150, borderRadius: 8 }}
            />
          </a>
        );
      }
      // otherwise simple link
      return (
        <a href={url} target="_blank" rel="noreferrer">
          {text.split("-").pop()} 🔗
        </a>
      );
    }
    return text;
  };

  /* ── JSX ────────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        background: "#fff",
        padding: "1rem",
        borderRadius: 12,
        maxWidth: 600,
        margin: "1rem auto",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h4>💬 Chat with Your Lawyer</h4>

      <div
        style={{
          maxHeight: 300,
          overflowY: "auto",
          padding: "0.5rem",
          border: "1px solid #eee",
          borderRadius: 10,
          marginBottom: "1rem",
          background: "#fafafa",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent:
                m.sender_type === "client" ? "flex-end" : "flex-start",
              margin: "0.2rem 0",
            }}
          >
            <div>
              <span
                style={{
                  background:
                    m.sender_type === "client" ? "#c2f0c2" : "#e0e0e0",
                  padding: "0.5rem 0.8rem",
                  borderRadius: 12,
                  display: "inline-block",
                  maxWidth: "80%",
                  wordBreak: "break-word",
                }}
              >
                {renderContent(m.text)}
              </span>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#777",
                  textAlign:
                    m.sender_type === "client" ? "right" : "left",
                }}
              >
                {formatTime(m.sent_at)}
              </div>
            </div>
          </div>
        ))}
        {typing && (
          <div
            style={{
              fontStyle: "italic",
              color: "#999",
              fontSize: "0.8rem",
            }}
          >
            Lawyer is typing…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* emoji */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 22,
          }}
        >
          😊
        </button>

        {/* file picker */}
        <button
          onClick={() => fileInputRef.current.click()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 22,
          }}
          title="Attach file"
        >
          📎
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFile}
        />

        {/* text area */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message and press Enter…"
          style={{
            flexGrow: 1,
            padding: "0.6rem",
            borderRadius: 8,
            border: "1px solid #ccc",
            resize: "none",
          }}
          rows={2}
        />

        {/* send */}
        <button
          onClick={send}
          style={{
            borderRadius: 6,
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            padding: "0.5rem 1rem",
          }}
        >
          ➤
        </button>
      </div>

      {showEmoji && (
        <div style={{ marginTop: "0.5rem" }}>
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}
    </div>
  );
}
