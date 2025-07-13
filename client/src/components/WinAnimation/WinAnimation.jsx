import React from "react";
import "./WinAnimation.css";

// Import a great custom font from Google Fonts (Montserrat Black)
const fontUrl = "https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap";

export default function WinAnimation({ visible, winnerName }) {
  if (!visible) return null;
  // Use "You Win!" if the winner is "You", otherwise "{username} Wins!"
  const text = winnerName === "You" ? "You Win!" : `${winnerName} Wins!`;
  return (
    <>
      <link href={fontUrl} rel="stylesheet" />
      <div className="win-animation">
        <span className="win-text-glow" style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}>
          🎉 {text} 🎉
        </span>
      </div>
    </>
  );
}
