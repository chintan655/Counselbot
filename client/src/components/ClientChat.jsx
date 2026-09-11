import React, {
  useState,
  useEffect,
  useRef,
  useContext,
} from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";
import EmojiPicker from "emoji-picker-react";

function ClientChat({ selectedClient }) {
  const { user } = useContext(AuthContext); // lawyer
  const [convId, setConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  /* ── fetch conversation + messages when client changes ─────────── */
  useEffect(() => {
    if (!selectedClient) return;

    axios
      .get(`${process.env.REACT_APP_API_URL}/api/lc/conversations`, authHeader)
      .then((res) => {
        const existing = res.data.find(
          (c) => c.client_id === selectedClient.id
        );
        if (existing) {
          setConvId(existing.id);
          return axios.get(
            `${process.env.REACT_APP_API_URL}/api/lc/messages/${existing.id}`,
            authHeader
          );
        } else {
          setConvId(null);
          setMessages([]);
          return null;
        }
      })
      .then((res) => res && setMessages(res.data))
      .catch((err) => console.error("Chat fetch error", err));
  }, [selectedClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── send text ─────────────────────────────────────────────────── */
  const handleSend = async () => {
    if (!input.trim()) return;
    const body = { client_id: selectedClient.id, text: input };

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/lc/lawyer/send`,
        body,
        authHeader
      );
      if (!convId) setConvId(res.data.conversation_id);

      setMessages((prev) => [
        ...prev,
        {
          sender_type: "lawyer",
          sender_user_id: user.id,
          text: input,
          sent_at: new Date(),
        },
      ]);
      setInput("");
      setShowEmoji(false);
    } catch (err) {
      console.error("Send fail", err.response?.data || err);
    }
  };

  /* ── upload file ───────────────────────────────────────────────── */
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!convId) {
      alert("Send a text first to create the conversation, then attach file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversation_id", convId);

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
        setMessages((prev) => [
          ...prev,
          {
            sender_type: "lawyer",
            text: res.data.file, // "/chat_files/..."
            sent_at: new Date(),
          },
        ]);
      }
    } catch (err) {
      console.error("File upload error", err.response?.data || err);
    } finally {
      e.target.value = "";
    }
  };

  /* ── typing / emoji helpers ────────────────────────────────────── */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      if (!typing) setTyping(true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTyping(false), 2000);
    }
  };

  const onEmojiClick = (emojiData) =>
    setInput((p) => p + emojiData.emoji);

  const formatTime = (t) =>
    new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
      return (
        <a href={url} target="_blank" rel="noreferrer">
          {text.split("-").pop()} 🔗
        </a>
      );
    }
    return text;
  };

  if (!selectedClient) return null;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "1rem",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        maxWidth: 600,
        margin: "1rem auto",
      }}
    >
      <h4>💬 Chat with {selectedClient.name}</h4>

      <div
        style={{
          maxHeight: 300,
          overflowY: "auto",
          padding: "0.5rem",
          border: "1px solid #eee",
          borderRadius: 10,
          background: "#fafafa",
          marginBottom: "1rem",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent:
                m.sender_type === "lawyer" ? "flex-end" : "flex-start",
              margin: "0.2rem 0",
            }}
          >
            <div>
              <span
                style={{
                  background:
                    m.sender_type === "lawyer" ? "#c2f0c2" : "#e0e0e0",
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
                    m.sender_type === "lawyer" ? "right" : "left",
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
            Client is typing…
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

        {/* text */}
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
          onClick={handleSend}
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

export default ClientChat;
