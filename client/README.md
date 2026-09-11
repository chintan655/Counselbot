# 🧑‍⚖️ CounselBot – Your Personal Legal Assistant

<!-- **CounselBot** is a full-stack AI-powered legal tool that helps lawyers and individuals manage clients, take smart notes, generate legal documents, chat with an AI lawyer, and organize legal files — all in one sleek dashboard. -->
**CounselBot** is a full-stack AI-powered legal tool that helps lawyers, clients, and law firm admins manage legal workflows with ease. From drafting legal documents to chatting with AI, managing files, and handling clients — it's all packed into one powerful dashboard.

<!-- > 🧠 Powered by Gemini API, CounselBot combines Google-level AI smarts with your client data for real-time legal drafting, smart chatbot advice, and fully automated workflows. -->

> 🧠 Powered by **Gemini API**, CounselBot brings Google-grade AI to your legal firm — drafting contracts, responding to queries, and working directly with your client data.

---

## ⚙️ Tech Stack

### 💻 Frontend
- React.js (Custom CSS — No Tailwind)
- Axios for API calls
- jsPDF for document downloads
- File Upload + Previews

### 🖥️ Backend
- Node.js + Express
- MySQL (Structured DB with Foreign Keys)
- Gemini API (for legal text generation)
- JWT Authentication
- Multer (File handling)
- Bcrypt (Password security)

---

## 🌟 Features

<!-- ✅ **Authentication**
- Register / Login (JWT-based)
- Auth-protected routes
- User-specific data isolation

👥 **Client Management**
- Add / Edit / Delete clients
- Linked with logged-in user -->

### ✅ **Authentication + Role-Based Access**
- Register/Login with JWT-based auth
- Three roles: `admin`, `lawyer`, and `client`
- Firm-based user isolation
- **Access rights by role**:

| Role     | Access Capabilities |
|----------|---------------------|
| 👑 **Admin** | Full access to all clients within their firm<br>Can add/edit/delete clients<br>Can assign clients to any lawyer in the same firm<br>View all documents, notes, files |
| 👨‍⚖️ **Lawyer** | Can add personal (private) clients<br>Can access/edit/delete only their own clients and assigned ones<br>Can Chat with their Clients personally<br>Use chatbot, upload files, generate documents |
| 👤 **Client** | Can chat with AI, generate legal docs, upload/view personal files<br>No access to client list, cannot add/edit clients<br>Can Chat with their Lawyer |

---

### 👥 **Client Management**
- Add / Edit / Delete clients (based on role)
- Admins can assign clients to lawyers
- Lawyers can manage only their assigned or private clients
- Clients are fully isolated

---

### 📩 **Smart Auto-Invite System**
- When a lawyer or admin **adds a client**, the system **automatically sends a personalized email invite**.
- Email includes a **secure registration link** 
- The registration form is **pre-filled with the client's name and email**, so they can sign up in seconds.
- Lawyers don’t need to follow up — it’s plug-n-play client onboarding!

---
### 💬** Real-Time Chat Enhancements (Lawyer ↔ Client)**
- Two-way chat between lawyer and client
- Share case related files to each other 
- Clean timestamps displayed under each message


📝 **Notes System**
- Add/edit/delete notes for each client
- Timestamp display
- Used in document generation

📄 **Document Generator**
- Create legal documents using:
  - Client details
  - Saved notes
  - Optional user input
- Documents saved to DB
- PDF download support
- Delete functionality
- Auto-format currency and dates
- 🆕 Upload Your Own Template! Users can upload any legal document template (DOCX or TXT), and CounselBot will automatically fill it using client info, notes, and AI suggestions.

💬 **AI Legal Chatbot**
- Uses Gemini API for smarter replies
- Can access client data, notes, documents
- Saves past chats
- Regenerate reply 🔁
- Chat-to-Document feature 📝
- Voice input 🎙️
- Multilingual Input (Hindi, Gujarati, English)
- 📎File Upload + AI-powered Analysis in Chat


📌 **Chat History**
- Save multiple chats with titles
- Edit, delete, pin chats

📂 **File Management**
- Upload files per client or personal
- View/download/delete files
- Linked to users and optionally clients

🗃️ **Saved Docs View**
- View all generated docs per client
- Delete, preview, and download options



---

## 🧠 AI Capabilities

- ✍️ Smart document generation (agreements, notices, custom legal docs)
- 📄 Auto-fill uploaded templates with user/client data
- 🧾 Understands legal structure and intent
- 🔁 Memory across chat session
- 🧑‍💼 Used by lawyers for fast, error-free drafting

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/Priyab12/counselbot.git
cd counselbot
```
---

### 2. Install dependencies

#### Backend
```bash
cd server
npm install
```
#### Frontend
```bash
cd ../client
npm install
```
---

### 3. Set up Environment Variables
- Create a .env file in /server with the following:
```bash
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=legal_tool
```
---

### 4. Run the app
```bash
# Start backend
cd server
npm start

# Start frontend (in a separate terminal)
cd client
npm start
```
---
### Author
Priyanka<br>
Engineering Student @ IIIT Vadodara<br>
Building tools that make real-world impact 💼⚖️

