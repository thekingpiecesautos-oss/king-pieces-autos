import React, { useState } from "react";
import "./App.css";
import logo from "./logo.png";
import imageKing from "./king-pieces.jpeg";

function App() {
  const [pageActive, setPageActive] = useState("stock");

  const pagesDisponibles = [
    { key: "stock", label: "Stock", icon: "📦" },
    { key: "devis", label: "Devis", icon: "📄" },
    { key: "clients", label: "Clients", icon: "👤" },
    { key: "fournisseurs", label: "Fournisseurs", icon: "🏭" },
    { key: "finances", label: "Finances", icon: "💰" },
    { key: "recettes", label: "Recettes", icon: "📊" },
    { key: "utilisateurs", label: "Utilisateurs", icon: "🔑" },
    { key: "parametres", label: "Paramètres", icon: "⚙️" },
  ];

  const renderPage = () => {
    if (pageActive === "stock") {
      return (
        <div className="page-card">
          <div className="page-hero">
            <div className="page-hero-left">
              <p className="breadcrumb">Accueil / Stock</p>
              <h1 className="page-title">Gestion du stock</h1>
              <p className="page-subtitle">
                Bienvenue sur ton espace King Pieces Autos.
              </p>

              <div className="dashboard-grid">
                <div className="dashboard-card">
                  <div className="dashboard-title">Pièces totales</div>
                  <div className="dashboard-value">0</div>
                </div>

                <div className="dashboard-card">
                  <div className="dashboard-title">Stock faible</div>
                  <div className="dashboard-value">0</div>
                </div>

                <div className="dashboard-card">
                  <div className="dashboard-title">Ruptures</div>
                  <div className="dashboard-value">0</div>
                </div>

                <div className="dashboard-card">
                  <div className="dashboard-title">Meilleures ventes</div>
                  <div className="dashboard-value">0</div>
                </div>
              </div>
            </div>

            <div className="page-hero-right">
              <img src={imageKing} alt="King Pieces Autos" className="hero-image" />
            </div>
          </div>
        </div>
      );
    }

    if (pageActive === "devis") {
      return (
        <div className="page-card">
          <p className="breadcrumb">Accueil / Devis</p>
          <h1 className="page-title">Devis</h1>
          <p className="page-subtitle">Page devis bientôt disponible.</p>
        </div>
      );
    }

    if (pageActive === "clients") {
      return (
        <div className="page-card">
          <p className="breadcrumb">Accueil / Clients</p>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Page clients bientôt disponible.</p>
        </div>
      );
    }

    if (pageActive === "fournisseurs") {
      return (
        <div className="page-card">
          <p className="breadcrumb">Accueil / Fournisseurs</p>
          <h1 className="page-title">Fournisseurs</h1>
          <p className="page-subtitle">Page fournisseurs bientôt disponible.</p>
        </div>
      );
    }

    if (pageActive === "finances") {
      return (
        <div className="page-card">
          <p className="breadcrumb">Accueil / Finances</p>
          <h1 className="page-title">Finances</h1>
          <p className="page-subtitle">Page finances bientôt disponible.</p>
        </div>
      );
    }

    if (pageActive === "recettes") {
      return (
        <div className="page-card">
          <p className="breadcrumb">Accueil / Recettes</p>
          <h1 className="page-title">Recettes</h1>
          <p className="page-subtitle">Page recettes bientôt disponible.</p>
        </div>
      );
    }

    if (pageActive === "utilisateurs") {
      return (
        <div className="page-card">
          <p className="breadcrumb">Accueil / Utilisateurs</p>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-subtitle">Page utilisateurs bientôt disponible.</p>
        </div>
      );
    }

    return (
      <div className="page-card">
        <p className="breadcrumb">Accueil / Paramètres</p>
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">Page paramètres bientôt disponible.</p>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <aside
        style={{
          background: "#0f172a",
          color: "#ffffff",
          padding: "24px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img
            src={logo}
            alt="Logo"
            style={{
              width: "52px",
              height: "52px",
              objectFit: "cover",
              borderRadius: "12px",
              background: "#fff",
            }}
          />
          <div>
            <div style={{ fontSize: "22px", fontWeight: "700", lineHeight: 1.1 }}>
              King Pieces Autos
            </div>
            <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>
              Tableau de bord
            </div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {pagesDisponibles.map((page) => (
            <button
              key={page.key}
              onClick={() => setPageActive(page.key)}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                borderRadius: "14px",
                padding: "14px 16px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "600",
                background: pageActive === page.key ? "#d4af37" : "rgba(255,255,255,0.08)",
                color: pageActive === page.key ? "#111827" : "#ffffff",
              }}
            >
              {page.icon} {page.label}
            </button>
          ))}
        </nav>
      </aside>

      <main style={{ padding: "28px" }}>{renderPage()}</main>
    </div>
  );
}

export default App;
