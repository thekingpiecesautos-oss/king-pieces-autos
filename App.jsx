import React from "react";

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, color: "#111827" }}>King Pieces Autos</h1>
        <p style={{ marginTop: "12px", color: "#6b7280" }}>
          Frontend en ligne
        </p>
      </div>
    </div>
  );
}

export default App;
