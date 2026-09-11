import React, { useState, useContext, useRef, useEffect, } from "react";
import { AuthContext } from "./AuthContext";
import Register from "./Register";
import Login from "./Login";
import axios from "axios";
import SavedDocs from "./SavedDocs";
import Chatbot from "./components/Chatbot";
import ClientList from "./components/ClientList";
import ClientHome from "./components/ClientHome";
import ClientProfile from "./components/ClientProfile";
import FileUploader from "./components/FileUploader";
import AssignClient from "./components/AssignClient";
import MyLawyerChat from "./components/MyLawyerChat";
import TemplateUploader from "./components/TemplateUploader";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Profile from "./components/Profile";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./fonts/NotoDev-normal";
import "./fonts/NotoGuj-normal"
import "./index.css";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

// -----------------------------------------------------------------------------
//  🏠  Root app component
// -----------------------------------------------------------------------------
function App() {
  /* ── Global UI state ─────────────────────────────────────────────── */
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState("login");
  const { user, logout } = useContext(AuthContext);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  /* ── Document‑generator state ────────────────────────────────────── */
  const [docType, setDocType] = useState("");
  const [customDocType, setCustomDocType] = useState("");
  const [clientInfo, setClientInfo] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [docSaved, setDocSaved] = useState(false);
  const [genMode, setGenMode] = useState("smart"); // 'smart' | 'template'
  const [templatePath, setTemplatePath] = useState("");
  const [loading, setLoading] = useState(false);



  /* ── Client‑specific state ───────────────────────────────────────── */
  const [clientId, setClientId] = useState(null);

  /* ── Refs ────────────────────────────────────────────────────────── */
  const generateRef = useRef(null);
  const savedDocsRef = useRef(null);
  const chatbotRef = useRef(null);
  const fileUploaderRef = useRef(null);
  const profileRef = useRef(null);

  /* ── Helpers ─────────────────────────────────────────────────────── */
  const NAV_HEIGHT = 72;
  const styles = {
    // ---------- Navbar ----------
    nav: {
      display: "flex",
      justifyContent: "center",
      gap: "1rem",
      flexWrap: "wrap",
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "9%",
      backgroundColor: "#fff",
      padding: "1rem",
      minHeight: "40px",
      borderRadius: "12px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      zIndex: 1000,
      alignItems: "center",

    },
    hamburger: {
      // display: "none", // enabled via media query on <=600px
      flexDirection: "column",
      gap: "4px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      justifyContent: "left",

    },
    navBtn: {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#4a90e2",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "bold",
      transition: "all 0.2s ease-in-out",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    },
    navBtnHover: {
      backgroundColor: "#1054a3",
      transform: "scale(1.10)",
      boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
    },
    navBtnActive: {
      backgroundColor: "#1010ad",
      transform: "scale(0.97)",
    },

    // ---------- Card wrapper ----------
    section: {
      width: "100%",
      margin: "0 auto",
      padding: "1rem",
      backgroundColor: "#fff",
      borderRadius: "0 0 12px 12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },

    // ---------- Inputs ----------
    label: { fontWeight: "bold", marginTop: "1rem", display: "block" },
    input: {
      width: "90%",
      padding: "0.5rem",
      marginBottom: "1rem",
      borderRadius: "6px",
      border: "1px solid #ccc",
    },
    button: {
      padding: "10px 20px",
      backgroundColor: "#2ecc71",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      marginRight: "10px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    docBox: {
      whiteSpace: "pre-wrap",
      backgroundColor: "#f9f9f9",
      padding: "1rem",
      borderRadius: "10px",
      marginTop: "1rem",
      border: "1px solid #ddd",
    },
  };

  const getNavBtnStyle = (name) => ({
    ...styles.navBtn,
    ...(page === name ? styles.navBtnActive : {}),
    ...(hoveredBtn === name ? styles.navBtnHover : {}),
  });

  /* ── Side‑drawer scroll lock ─────────────────────────────────────── */
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
  }, [isDrawerOpen]);

  /* ── Network actions ─────────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!clientInfo) return toast.error("Client Info required!");

    try {
      setLoading(true);
      let res;
      if (genMode === "smart") {
        if (!docType) return toast.error("Pick a doc type!");
        res = await axios.post(`${process.env.REACT_APP_API_URL}/api/documents/generate`, {
          docType,
          clientInfo,
        });
      } else {
        if (!templatePath) return toast.error("Upload a template first!");
        res = await axios.post(`${process.env.REACT_APP_API_URL}/api/documents/generate-from-template`, {
          templatePath,
          clientInfo,
        });
      }
      setGeneratedDoc(res.data.document);
    } catch (err) {
      console.error(err);
      setGeneratedDoc("Generation failed.");
    }
    finally {
      setLoading(false);              // 🛑 stop spinner whether success or fail
    }
  };

  const Loader = () => (
    <div className="loader-overlay">
      <div className="spinner" />
      <span>Generating… hang tight ⚙️</span>
    </div>
  );


  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/documents/save`,
        {
          client_id: clientId,
          doc_type: customDocType || docType,
          content: generatedDoc,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("📄 Document saved successfully!");
        { docSaved && <p style={{ color: "green" }}>✔️ Saved!</p> }
        setDocSaved(true);
      }
    } catch (err) {
      console.error("Error saving document:", err.response?.data || err.message);
      toast.error("Failed to save document.");
    }
  };
  const downloadPDF = (text, lang) => {
    const pdf = new jsPDF();

    const margin = 10;
    const lineHeight = 10;
    const pageHeight = pdf.internal.pageSize.height;
    let y = margin;

    if (lang === "hi") {
      pdf.setFont("NotoSansDevanagari-Regular");
    } else if (lang === "gu") {
      pdf.setFont("NotoSansGujarati-Regular");
    } else {
      // English - use default font
      pdf.setFont("helvetica"); // default jsPDF font
    }

    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(text, 180);

    lines.forEach(line => {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    });

    pdf.save("document.pdf");
  };


  const detectLang = (text) => {
    if (/[\u0A80-\u0AFF]/.test(text)) return "gu";  // Gujarati Unicode
    if (/[\u0900-\u097F]/.test(text)) return "hi";  // Hindi/Devanagari Unicode
    return "en";
  };



  /* ── NavButtons component (reused in nav + drawer) ───────────────── */
  const NavButtons = ({ closeDrawer }) => (
    <>
      {!user ? (
        <>
          <button
            style={getNavBtnStyle("login")}
            // onClick={() => setPage("login")}
            onClick={() => { setPage("login"); closeDrawer?.(); }}
          >
            Login
          </button>
          <button
            style={getNavBtnStyle("register")}
            // onClick={() => setPage("register")}
            onClick={() => { setPage("register"); closeDrawer?.(); }}
          >
            Register
          </button>
        </>
      ) : (
        <>
          <button
            style={getNavBtnStyle("dashboard")}
            onClick={() => { setPage("dashboard"); closeDrawer?.(); }}
            onMouseEnter={() => setHoveredBtn("dashboard")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            Dashboard
          </button>

          {user?.role === "admin" && (
            <button
              style={getNavBtnStyle("assign_client")}
              onClick={() => {
                setPage("assign_client");
                setTimeout(() => savedDocsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                closeDrawer?.();
              }}
              onMouseEnter={() => setHoveredBtn("assign_client")}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Assign Client
            </button>
          )}

          {user.role === "client" && (
            <button
              style={getNavBtnStyle("lawyer_chat")}
              onClick={() => {
                setPage("lawyer_chat");
                setTimeout(() => savedDocsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                closeDrawer?.();
              }}
              onMouseEnter={() => setHoveredBtn("lawyer_chat")}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Chat with Lawyer
            </button>
          )}


          <button
            style={getNavBtnStyle("generate")}
            onClick={() => {
              setPage("generate");
              setTimeout(() => generateRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
              closeDrawer?.();
            }}
            onMouseEnter={() => setHoveredBtn("generate")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            Generate Docs
          </button>
          <button
            style={getNavBtnStyle("saved_docs")}
            onClick={() => {
              setPage("saved_docs");
              setTimeout(() => savedDocsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
              closeDrawer?.();
            }}
            onMouseEnter={() => setHoveredBtn("saved_docs")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            Saved Docs
          </button>
          <button
            style={getNavBtnStyle("chatbot")}
            onClick={() => {
              setPage("chatbot");
              setTimeout(() => chatbotRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
              closeDrawer?.();
            }}
            onMouseEnter={() => setHoveredBtn("chatbot")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            Chatbot
          </button>
          <button
            style={getNavBtnStyle("file_uploader")}
            onClick={() => {
              setPage("file_uploader");
              setTimeout(() => fileUploaderRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
              closeDrawer?.();
            }}
            onMouseEnter={() => setHoveredBtn("file_uploader")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            File Uploader
          </button>
          <button
              style={getNavBtnStyle("profile")}
              onClick={() => {
                setPage("profile"); 
                setTimeout(() =>profileRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                closeDrawer?.();
              }}
              onMouseEnter={() => setHoveredBtn("profile")}
              onMouseLeave={() => setHoveredBtn(null)}
            >
               Profile
            </button>
          <button
            style={{ ...styles.navBtn, backgroundColor: "#e74c3c" }}
            onClick={logout}
            onMouseEnter={() => setHoveredBtn("logout")}
            onMouseLeave={() => setHoveredBtn(null)}
          >

            Logout
          </button>
        </>
      )}
    </>
  );

  /* ── JSX ──────────────────────────────────────────────────────────── */
  return (
    <div
      className="app-wrapper"
      style={{
        padding: `calc(1rem + ${NAV_HEIGHT}px) 1rem 1rem`,
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* -----------------------------------------------------------------
          Navbar (desktop) + hamburger button
      ----------------------------------------------------------------- */}
      <nav style={styles.nav}>
        <button
          // className="hamburger-btn"
          className={`hamburger-btn ${isDrawerOpen ? "open" : ""}`}
          // style={styles.hamburger}
          onClick={() => setDrawerOpen(!isDrawerOpen)}
          aria-label="Toggle navigation"
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        {/* 🏠 Logo – click to go Home/Dashboard */}
        <div className="logo-container desktop-only" onClick={() => setPage("dashboard")} title="Go to Dashboard">
          <h1 className="logo">
            <span className="logo-icon">⚖️</span>
            <span className="logo-text">Counsel<span className="logo-highlight">Bot</span></span>
          </h1>
          <div className="tagline">Your AI Legal Assistant 👩‍⚖️📄</div>
        </div>

        {/* <h1
  className="logo desktop-only"
  onClick={() => setPage("dashboard")}
  title="Go to Dashboard"
>
  <span className="logo-icon">⚖️</span>
  <span className="logo-text">Counsel<span className="logo-highlight">Bot</span></span>
</h1> */}


        <div className="nav-links desktop-only">
          <NavButtons />
        </div>
      </nav>

      {/* -----------------------------------------------------------------
          Side drawer (mobile)
      ----------------------------------------------------------------- */}
      {/* ── Side drawer (mobile) ───────────────────────────── */}
      <aside className={`mobile-drawer ${isDrawerOpen ? "open" : ""}`} role="complementary" aria-label="Mobile Drawer">
        {/* Close-drawer button */}
        <button                      // <— use a real button for a11y
          className="drawer-close"
          onClick={() => setDrawerOpen(false)}   // 🚫 no setPage()
          aria-label="Close menu"
        >
          ✖️
        </button>

        <NavButtons closeDrawer={() => setDrawerOpen(false)} />
      </aside>

      {/* backdrop click closes too */}
      {isDrawerOpen && (
        <div className="backdrop" onClick={() => setDrawerOpen(false)} />
      )}

      {isDrawerOpen && <div className="backdrop" onClick={() => setDrawerOpen(false)} />}

      {/* -----------------------------------------------------------------
          Auth vs. main app content
      ----------------------------------------------------------------- */}
      {!user ? (
        page === "register" ? <Register /> :
          page === "reset_password" ? <ResetPassword setPage={setPage} /> :
            page === "forgot_password" ? <ForgotPassword setPage={setPage} /> :
              <Login setPage={setPage} />
      ) : (
        <div className="section-card" style={styles.section}>
          <h3>Welcome, {user.name}!</h3>
          {user.role === "client"
            ? <ClientHome setPage={setPage} />      // 🔄 show client‑friendly dash
            : <ClientList setPage={setPage} setClientId={setClientId} />}

          {page === "assign_client" && user?.role === "admin" && <AssignClient />}

          {page === "lawyer_chat" && user.role === "client" && <MyLawyerChat />}

          {/* -------------- Generate Docs -------------- */}
          {page === "generate" && (
            <div ref={generateRef}>
              <h2>🧠 Legal Document Generator</h2>

              {/* --- mode toggle --- */}
              <label style={{ marginRight: "1rem" }}>
                <input
                  type="radio"
                  value="smart"
                  checked={genMode === "smart"}
                  onChange={() => setGenMode("smart")}
                />{" "}
                AI Draft
              </label>
              <label>
                <input
                  type="radio"
                  value="template"
                  checked={genMode === "template"}
                  onChange={() => setGenMode("template")}
                />{" "}
                Fill Template
              </label>
              <br />

              {/* --- smart mode inputs --- */}
              {genMode === "smart" && (
                <>
                  <label style={styles.label}>📄 Document Type:</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">-- Select Document Type --</option>
                    <option value="Affidavit">Affidavit</option>
                    <option value="Rent Agreement">Rent Agreement</option>
                    <option value="NDA">NDA (Non-Disclosure Agreement)</option>
                    <option value="Employment Contract">Employment Contract</option>
                    <option value="Legal Notice">Legal Notice</option>
                    <option value="Other">Other (type manually below)</option>
                  </select>
                  {docType === "Other" && (
                    <input
                      type="text"
                      value={customDocType}
                      onChange={(e) => setCustomDocType(e.target.value)}
                      placeholder="Enter custom document type"
                      style={{ ...styles.input, marginTop: "0.5rem" }}
                    />
                  )}
                </>
              )}

              {/* --- template mode inputs --- */}
              {genMode === "template" && (
                <>
                  <TemplateUploader onUploadSuccess={setTemplatePath} />
                  {templatePath && (
                    <p style={{ fontSize: "0.9rem" }}>✔️ Uploaded: {templatePath}</p>
                  )}
                </>
              )}

              <label style={styles.label}>👤 Client Info:</label>
              <textarea
                rows={6}
                value={clientInfo}
                onChange={(e) => setClientInfo(e.target.value)}
                placeholder="e.g. Ramesh is renting a house in Surat for ₹10,000..."
                style={{ ...styles.input, width: "90%" }}
              />

              <button onClick={handleGenerate} style={{
                ...styles.button, opacity: loading ? 0.6 : 1,
                pointerEvents: loading ? "none" : "auto",
              }}>
                {loading ? "Generating..." : genMode === "smart" ? "Generate Document" : "Fill Template"}
              </button>


              {generatedDoc && (
                <div style={styles.docBox}>
                  <h3>📄 Generated Document:</h3>
                  <p>{generatedDoc}</p>
                  <button onClick={handleSave} style={styles.button}>
                    Save Document
                  </button>
                  <button onClick={() => {
                    const lang = detectLang(generatedDoc);
                    downloadPDF(generatedDoc, lang);
                  }} style={styles.button}>
                    Download PDF
                  </button>
                  {loading && <Loader />}
                </div>
              )}
            </div>
          )}

          {/* -------------- Saved Docs -------------- */}
          {page === "saved_docs" && (
            <div ref={savedDocsRef}>
              <SavedDocs />
            </div>
          )}

          {/* -------------- Chatbot -------------- */}
          {page === "chatbot" && (
            <div ref={chatbotRef}>
              <Chatbot />
            </div>
          )}

          {/* -------------- File Uploader -------------- */}
          {page === "file_uploader" && (
            <div ref={fileUploaderRef}>
              <FileUploader clientId={clientId} />
            </div>
          )}

          {page === "profile" &&  (<div ref={profileRef}> <Profile /> </div>)}


          {/* -------------- Client Profile -------------- */}
          {page === "client_profile" && <ClientProfile clientId={clientId} />}
        </div>
      )}

      <Toaster position="top-center" />

    </div>
  );
}
export default App;