import React, { useState } from "react";
import { apiFetch } from "./api";

function Connexion({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const user = await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("session_utilisateur", JSON.stringify(user));
      onLogin(user);
    } catch (error) {
      setErreur(error.message || "Nom d'utilisateur ou mot de passe invalide.");
    } finally {
      setChargement(false);
    }
  };

  const styles = {
    page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)" },
    box: { width: "100%", maxWidth: 460, background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 12px 30px rgba(15,23,42,0.10)" },
    title: { margin: 0, fontSize: 36, color: "#0f172a" },
    subtitle: { margin: "10px 0 20px 0", color: "#64748b" },
    input: { width: "100%", padding: "14px 16px", borderRadius: 14, border: "1px solid #cbd5e1", marginBottom: 14, fontSize: 15, outline: "none", boxSizing: "border-box" },
    button: { width: "100%", border: "none", borderRadius: 14, padding: "14px 18px", fontWeight: "bold", cursor: "pointer", background: "linear-gradient(90deg, #d4af37, #f4d26b)", color: "#111827", fontSize: 15, opacity: chargement ? 0.7 : 1 },
    error: { background: "#fee2e2", color: "#991b1b", borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 14 },
    help: { marginTop: 14, fontSize: 13, color: "#64748b", lineHeight: 1.5 },
  };

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <p className="breadcrumb">Connexion</p>
        <h1 style={styles.title}>The King Pieces Autos</h1>
        <p style={styles.subtitle}>Connecte-toi avec ton nom d’utilisateur et ton mot de passe.</p>
        <form onSubmit={handleSubmit}>
          {erreur ? <div style={styles.error}>{erreur}</div> : null}
          <input style={styles.input} placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input style={styles.input} type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" style={styles.button} disabled={chargement}>{chargement ? "Connexion..." : "Se connecter"}</button>
        </form>
        <div style={styles.help}>Compte administrateur par défaut :<br />utilisateur : <strong>admin</strong><br />mot de passe : <strong>admin123</strong></div>
      </div>
    </div>
  );
}

export default Connexion;
