import React, { useRef, useState } from "react";

export default function ReplaceUploadButton({ docType, uploadId, onDone }) {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleClick = () => {
    setError(null);
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("document", file);
      // Optionally add privacy_tier, etc.
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/uploads/${docType}/replace`);
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          setProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      };
      xhr.onload = () => {
        setUploading(false);
        setProgress(0);
        if (xhr.status >= 200 && xhr.status < 300) {
          const resp = JSON.parse(xhr.responseText);
          if (resp.success && onDone) onDone(resp.data);
        } else {
          setError(xhr.responseText || "Upload failed");
        }
      };
      xhr.onerror = () => {
        setUploading(false);
        setError("Network error");
      };
      xhr.send(formData);
    } catch (err) {
      setUploading(false);
      setError(err.message);
    }
  };

  return (
    <>
      <button
        className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
        onClick={handleClick}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Replace"}
      </button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        accept="application/pdf"
      />
      {uploading && (
        <div className="w-32 mt-2">
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-blue-500 rounded"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mt-1">Uploading... {progress}%</div>
        </div>
      )}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </>
  );
}
