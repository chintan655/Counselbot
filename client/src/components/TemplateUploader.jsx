import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function TemplateUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);

  const upload = async () => {
    if (!file) return toast.error("Choose a template first");
    const token = localStorage.getItem("token");
    const fd = new FormData();
    fd.append("template", file);
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/templates/upload`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUploadSuccess(data.path);  // pass back /uploads/<file>
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".doc,.docx,.txt,.rtf,.pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={upload}>Upload Template</button>
    </>
  );
}
