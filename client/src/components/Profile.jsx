import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css"; // Make sure this file exists

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/profile/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading) return <div className="loading">Loading profile...</div>;
  if (!profile) return <div className="error">Could not load profile.</div>;

  return (
    <div className="profile-container">
      <h2 className="profile-title">👤 My Profile</h2>

      <div className="tab-buttons">
        <button
          className={activeTab === "info" ? "tab active" : "tab"}
          onClick={() => setActiveTab("info")}
        >
          Profile Info
        </button>
        {(profile.role === "admin" || profile.role === "lawyer") && (
          <button
            className={activeTab === "clients" ? "tab active" : "tab"}
            onClick={() => setActiveTab("clients")}
          >
            Clients
          </button>
        )}
        {profile.role === "client" && (
          <button
            className={activeTab === "files" ? "tab active" : "tab"}
            onClick={() => setActiveTab("files")}
          >
            Files
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === "info" && (
          <div className="profile-card">
            <p><strong>👩 Name:</strong> {profile.name}</p>
            <p><strong>📧 Email:</strong> {profile.email}</p>
            <p><strong>🏢 Role:</strong> {profile.role}</p>
            <p><strong>📆 Joined:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
            {/* <p><strong>🏷️ User ID:</strong> {profile.id}</p> */}
            <p><strong>🏢 Firm:</strong> {profile.firm_name || "Not linked"}</p>
            {profile.role === "client" && (
              <>
                <p><strong>📱 Phone:</strong> {profile.client_info?.phone || "Not available"}</p>
                <p><strong>🧑‍⚖️ Assigned Lawyer:</strong> {profile.lawyer_name}</p>
              </>
            )}
          </div>
        )}

        {activeTab === "clients" && (
          <div className="profile-card">
            {profile.role === "admin" && (
              <>
                <h3>👥 Lawyers</h3>
                <ul>
                  {profile.lawyers?.length ? profile.lawyers.map((l, i) => (
                    <li key={i}>{l.name} ({l.email})</li>
                  )) : <li>No lawyers</li>}
                </ul>

                <h3>🧑‍💼 Clients</h3>
                <ul>
                  {profile.clients?.length ? profile.clients.map((c, i) => (
                    <li key={i}>{c.name} ({c.email}) - Lawyer: {c.lawyer_name || "Unassigned"}</li>
                  )) : <li>No clients</li>}
                </ul>
              </>
            )}

            {profile.role === "lawyer" && (
              <>
                <h3>👨‍💼 Assigned Clients</h3>
                <ul>
                  {profile.clients?.length ? profile.clients.map((c, i) => (
                    <li key={i}>{c.name} ({c.email}) - Added by: {c.added_by || "Unknown"}</li>
                  )) : <li>No assigned clients</li>}
                </ul>
              </>
            )}
          </div>
        )}

        {activeTab === "files" && profile.role === "client" && (
          <div className="profile-card">
            <h3>📎 Uploaded Files</h3>
            <ul>
              {profile.files?.length ? profile.files.map((f, i) => (
                <li key={i}>{f.original_name} – {new Date(f.uploaded_at).toLocaleDateString()}</li>
              )) : <li>No files</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
