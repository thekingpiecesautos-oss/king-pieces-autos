import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";

function Utilisateurs() {
  const today = () => new Date().toISOString().split("T")[0];
  const makeId = () => Date.now() + Math.random();

  const pagesDisponibles = [
    { key: "stock", label: "Stock" },
    { key: "devis", label: "Devis" },
    { key: "clients", label: "Clients" },
    { key: "fournisseurs", label: "Fournisseurs" },
    { key: "finances", label: "Finances" },
    { key: "recettes", label: "Recettes" },
    { key: "utilisateurs", label: "Utilisateurs" },
  ];

  const allAccess = pagesDisponibles.reduce((acc, page) => {
    acc[page.key] = true;
    return acc;
  }, {});

  const emptyAccess = pagesDisponibles.reduce((acc, page) => {
    acc[page.key] = false;
    return acc;
  }, {});


  const normalizeUser = (user) => {
    const type = user.type || "vendeur";
    const access =
      type === "administrateur"
        ? { ...allAccess }
        : {
            ...emptyAccess,
            ...(user.access || {}),
          };

    return {
      id: user.id || makeId(),
      nom: user.nom || "",
      username: user.username || "",
      password: user.password || "",
      type,
      actif: typeof user.actif === "boolean" ? user.actif : true,
      access,
      dateCreation: user.dateCreation || today(),
    };
  };

  const [utilisateurs, setUtilisateurs] = useState([]);

  const [recherche, setRecherche] = useState("");
  const [editId, setEditId] = useState(null);

  const [formUser, setFormUser] = useState({
    nom: "",
    username: "",
    password: "",
    type: "administrateur",
    actif: true,
    access: { ...allAccess },
  });

  useEffect(() => {
    apiFetch("/api/users")
      .then((data) => setUtilisateurs(Array.isArray(data) ? data.map(normalizeUser) : []))
      .catch(console.error);
  }, []);

  const utilisateursFiltres = useMemo(() => {
    return utilisateurs.filter((user) => {
      const texte = `${user.nom} ${user.username} ${user.type}`.toLowerCase();
      return texte.includes(recherche.toLowerCase());
    });
  }, [utilisateurs, recherche]);

  const styles = {
    page: {
      width: "100%",
    },
    header: {
      background: "rgba(255,255,255,0.92)",
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
      boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
    },
    title: {
      margin: 0,
      fontSize: 42,
      color: "#0f172a",
    },
    subtitle: {
      margin: "10px 0 0 0",
      color: "#64748b",
    },
    card: {
      background: "#fff",
      borderRadius: 20,
      padding: 22,
      boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
      marginBottom: 20,
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: 12,
      border: "1px solid #cbd5e1",
      background: "#fff",
      outline: "none",
      fontSize: 14,
      minWidth: 0,
      boxSizing: "border-box",
    },
    formGrid4: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: 12,
    },
    accessGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: 12,
      marginTop: 14,
    },
    accessItem: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 14,
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontWeight: "bold",
    },
    buttonGold: {
      background: "linear-gradient(90deg, #d4af37, #f4d26b)",
      color: "#111827",
      border: "none",
      borderRadius: 12,
      padding: "12px 18px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    buttonDark: {
      background: "#0f172a",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "10px 14px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    buttonRed: {
      background: "#dc2626",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "10px 14px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    buttonGreen: {
      background: "#16a34a",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "10px 14px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    buttonOrange: {
      background: "#f59e0b",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "10px 14px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    actionsRow: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
    },
    tableWrap: {
      overflowX: "auto",
      marginTop: 14,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: 950,
    },
    th: {
      textAlign: "left",
      padding: 12,
      borderBottom: "1px solid #e2e8f0",
      background: "#f8fafc",
      fontSize: 14,
      whiteSpace: "nowrap",
    },
    td: {
      padding: 12,
      borderBottom: "1px solid #e2e8f0",
      fontSize: 14,
      verticalAlign: "top",
    },
    badgeGreen: {
      display: "inline-block",
      background: "#16a34a",
      color: "#fff",
      padding: "7px 12px",
      borderRadius: 999,
      fontWeight: "bold",
      fontSize: 12,
    },
    badgeRed: {
      display: "inline-block",
      background: "#dc2626",
      color: "#fff",
      padding: "7px 12px",
      borderRadius: 999,
      fontWeight: "bold",
      fontSize: 12,
    },
    badgeBlue: {
      display: "inline-block",
      background: "#2563eb",
      color: "#fff",
      padding: "7px 12px",
      borderRadius: 999,
      fontWeight: "bold",
      fontSize: 12,
    },
    smallText: {
      color: "#64748b",
      fontSize: 13,
      marginTop: 6,
    },
    topBar: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "center",
      marginTop: 14,
    },
  };

  const resetForm = () => {
    setFormUser({
      nom: "",
      username: "",
      password: "",
      type: "administrateur",
      actif: true,
      access: { ...allAccess },
    });
    setEditId(null);
  };

  const handleTypeChange = (type) => {
    setFormUser((prev) => ({
      ...prev,
      type,
      access: type === "administrateur" ? { ...allAccess } : { ...emptyAccess },
    }));
  };

  const toggleAccess = (pageKey) => {
    setFormUser((prev) => ({
      ...prev,
      access: {
        ...prev.access,
        [pageKey]: !prev.access[pageKey],
      },
    }));
  };

  const saveUser = async (e) => {
    e.preventDefault();

    if (!formUser.nom.trim()) {
      alert("Entre le nom.");
      return;
    }

    if (!formUser.username.trim()) {
      alert("Entre le nom d'utilisateur.");
      return;
    }

    if (!formUser.password.trim()) {
      alert("Entre le mot de passe.");
      return;
    }

    const usernameExiste = utilisateurs.some(
      (u) =>
        u.username.toLowerCase() === formUser.username.toLowerCase() &&
        u.id !== editId
    );

    if (usernameExiste) {
      alert("Ce nom d'utilisateur existe déjà.");
      return;
    }

    const user = normalizeUser({
      id: editId || makeId(),
      nom: formUser.nom,
      username: formUser.username,
      password: formUser.password,
      type: formUser.type,
      actif: formUser.actif,
      access: formUser.type === "administrateur" ? { ...allAccess } : formUser.access,
      dateCreation:
        editId && utilisateurs.find((u) => u.id === editId)?.dateCreation
          ? utilisateurs.find((u) => u.id === editId).dateCreation
          : today(),
    });

    try {
      const saved = editId
        ? await apiFetch(`/api/users/${editId}`, { method: "PUT", body: JSON.stringify(user) })
        : await apiFetch("/api/users", { method: "POST", body: JSON.stringify(user) });

      if (editId) {
        setUtilisateurs((prev) => prev.map((u) => (u.id === editId ? normalizeUser(saved) : u)));
      } else {
        setUtilisateurs((prev) => [normalizeUser(saved), ...prev]);
      }

      resetForm();
    } catch (error) {
      alert(error.message || "Impossible d'enregistrer l'utilisateur.");
    }
  };

  const editUser = (user) => {
    setFormUser({
      nom: user.nom,
      username: user.username,
      password: user.password,
      type: user.type,
      actif: user.actif,
      access:
        user.type === "administrateur" ? { ...allAccess } : { ...user.access },
    });
    setEditId(user.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteUser = async (id) => {
    const ok = window.confirm("Voulez-vous supprimer cet utilisateur ?");
    if (!ok) return;

    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      setUtilisateurs((prev) => prev.filter((u) => u.id !== id));
      if (editId === id) {
        resetForm();
      }
    } catch (error) {
      alert(error.message || "Impossible de supprimer l'utilisateur.");
    }
  };

  const toggleActif = async (id) => {
    const cible = utilisateurs.find((u) => u.id === id);
    if (!cible) return;

    try {
      const saved = await apiFetch(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...cible, actif: !cible.actif }),
      });
      setUtilisateurs((prev) => prev.map((u) => (u.id === id ? normalizeUser(saved) : u)));
    } catch (error) {
      alert(error.message || "Impossible de modifier le statut.");
    }
  };

  const formatAccess = (user) => {
    if (user.type === "administrateur") return "Accès total";

    return pagesDisponibles
      .filter((page) => user.access?.[page.key])
      .map((page) => page.label)
      .join(", ");
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p className="breadcrumb">Accueil / Utilisateurs</p>
        <h1 style={styles.title}>Utilisateurs</h1>
        <p style={styles.subtitle}>
          Crée autant d’administrateurs et de vendeurs que tu veux, puis choisis les accès des vendeurs.
        </p>

        <div style={styles.topBar}>
          <input
            style={{ ...styles.input, maxWidth: 320 }}
            placeholder="Rechercher un utilisateur..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.card}>
        <h3>{editId ? "Modifier utilisateur" : "Créer un utilisateur"}</h3>

        <form onSubmit={saveUser}>
          <div style={styles.formGrid4}>
            <input
              style={styles.input}
              placeholder="Nom"
              value={formUser.nom}
              onChange={(e) =>
                setFormUser((prev) => ({ ...prev, nom: e.target.value }))
              }
            />

            <input
              style={styles.input}
              placeholder="Nom d'utilisateur"
              value={formUser.username}
              onChange={(e) =>
                setFormUser((prev) => ({ ...prev, username: e.target.value }))
              }
            />

            <input
              style={styles.input}
              placeholder="Mot de passe"
              value={formUser.password}
              onChange={(e) =>
                setFormUser((prev) => ({ ...prev, password: e.target.value }))
              }
            />

            <select
              style={styles.input}
              value={formUser.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <option value="administrateur">Administrateur</option>
              <option value="vendeur">Vendeur</option>
            </select>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ fontWeight: "bold", display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={formUser.actif}
                onChange={(e) =>
                  setFormUser((prev) => ({ ...prev, actif: e.target.checked }))
                }
              />
              Compte actif
            </label>
          </div>

          {formUser.type === "administrateur" ? (
            <div style={{ ...styles.card, marginTop: 18, marginBottom: 0, background: "#f8fafc" }}>
              <strong>Accès administrateur :</strong>
              <div style={styles.smallText}>
                L’administrateur a automatiquement accès à tout le logiciel.
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 18 }}>
              <strong>Accès du vendeur :</strong>

              <div style={styles.accessGrid}>
                {pagesDisponibles.map((page) => (
                  <label key={page.key} style={styles.accessItem}>
                    <input
                      type="checkbox"
                      checked={!!formUser.access[page.key]}
                      onChange={() => toggleAccess(page.key)}
                    />
                    {page.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ ...styles.actionsRow, marginTop: 20 }}>
            <button type="submit" style={styles.buttonGold}>
              {editId ? "Mettre à jour" : "Créer utilisateur"}
            </button>

            {editId && (
              <button type="button" style={styles.buttonDark} onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <h3>Liste des utilisateurs</h3>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nom</th>
                <th style={styles.th}>Nom d'utilisateur</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Accès</th>
                <th style={styles.th}>Date création</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {utilisateursFiltres.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan="7">
                    Aucun utilisateur enregistré.
                  </td>
                </tr>
              ) : (
                utilisateursFiltres.map((user) => (
                  <tr key={user.id}>
                    <td style={styles.td}>{user.nom}</td>
                    <td style={styles.td}>{user.username}</td>
                    <td style={styles.td}>
                      {user.type === "administrateur" ? (
                        <span style={styles.badgeBlue}>Administrateur</span>
                      ) : (
                        <span style={styles.badgeGreen}>Vendeur</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {user.actif ? (
                        <span style={styles.badgeGreen}>Actif</span>
                      ) : (
                        <span style={styles.badgeRed}>Inactif</span>
                      )}
                    </td>
                    <td style={styles.td}>{formatAccess(user) || "-"}</td>
                    <td style={styles.td}>{user.dateCreation}</td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button
                          type="button"
                          style={styles.buttonDark}
                          onClick={() => editUser(user)}
                        >
                          Modifier
                        </button>

                        <button
                          type="button"
                          style={user.actif ? styles.buttonOrange : styles.buttonGreen}
                          onClick={() => toggleActif(user.id)}
                        >
                          {user.actif ? "Désactiver" : "Activer"}
                        </button>

                        <button
                          type="button"
                          style={styles.buttonRed}
                          onClick={() => deleteUser(user.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Utilisateurs;