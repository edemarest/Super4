import React from "react";
import "./StatusMessage.css";

export default function StatusMessage({ message, visible }) {
  if (!visible) return null;
  return (
    <div className="status-message">
      {message}
    </div>
  );
}
