import React from "react";
import { apiFetch } from "./api";

function Parametres() {
  const formatDate = () => new Date().toISOString().split("T")[0];

  const telechargerFichier = (nom, contenu) => {
    const blob = new Blob([contenu], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nom;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);
  };

  const sauvegarderLogiciel = async () => {
    try {
      const sauvegarde = await apiFetch("/api/settings/export");
      const nomFichier = `sauvegarde-king-pieces-${formatDate()}.json`;
      telechargerFichier(nomFichier, JSON.stringify(sauvegarde, null, 2));
      alert("Sauvegarde téléchargée avec succès.");
    } catch (error) {
      console.error(error);
      alert("Impossible de créer la sauvegarde.");
    }
  };

  const restaurerSauvegarde = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const texte = await file.text();
      const contenu = JSON.parse(texte);
      if (!contenu?.donnees) {
        alert("Fichier de sauvegarde invalide.");
        return;
      }
      const confirmation = window.confirm("Cette action va remplacer les données actuelles du logiciel. Voulez-vous continuer ?");
      if (!confirmation) return;
      await apiFetch("/api/settings/import", {
        method: "POST",
        body: JSON.stringify(contenu),
      });
      alert("Sauvegarde restaurée avec succès. La page va se recharger.");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Impossible de restaurer cette sauvegarde.");
    } finally {
      event.target.value = "";
    }
  };

  const styles = {
    page: { width: "100%" },
    header: { background: "rgba(255,255,255,0.92)", borderRadius: 24, padding: 24, marginBottom: 20, boxShadow: "0 10px 25px rgba(15,23,42,0.08)" },
    title: { margin: 0, fontSize: 42, color: "#0f172a" },
    subtitle: { margin: "10px 0 0 0", color: "#64748b" },
    card: { background: "#fff", borderRadius: 20, padding: 22, boxShadow: "0 10px 25px rgba(15,23,42,0.08)", marginBottom: 20 },
    sectionTitle: { margin: "0 0 16px 0", fontSize: 24, color: "#0f172a" },
    actionsRow: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
    buttonGold: { background: "linear-gradient(90deg, #d4af37, #f4d26b)", color: "#111827", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: "bold", cursor: "pointer" },
    buttonDark: { background: "#0f172a", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: "bold", cursor: "pointer", display: "inline-block" },
    hiddenInput: { display: "none" },
    infoBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, lineHeight: 1.7, color: "#334155" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p className="breadcrumb">Accueil / Paramètres</p>
        <h1 style={styles.title}>Paramètres</h1>
        <p style={styles.subtitle}>Sauvegarde, restauration et informations du logiciel.</p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Sauvegarde du logiciel</h3>
        <div style={styles.actionsRow}>
          <button type="button" style={styles.buttonGold} onClick={sauvegarderLogiciel}>Sauvegarder le logiciel</button>
          <label style={styles.buttonDark}>
            Restaurer une sauvegarde
            <input type="file" accept=".json" style={styles.hiddenInput} onChange={restaurerSauvegarde} />
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Informations logiciel</h3>
        <div style={styles.infoBox}>
          <div><strong>Nom :</strong> The King Pieces Autos</div>
          <div><strong>Version :</strong> 2.0</div>
          <div><strong>Modules :</strong> Stock, Devis, Clients, Fournisseurs, Finances, Recettes, Utilisateurs, Paramètres</div>
          <div><strong>Stockage :</strong> PostgreSQL centralisé</div>
          <div><strong>Sauvegarde :</strong> export complet au format JSON</div>
          <div><strong>Restauration :</strong> remplacement complet des données actuelles</div>
        </div>
      </div>
    </div>
  );
}

export default Parametres;
