import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchStore, saveStore } from "./api";

function Fournisseurs() {
  const today = () => new Date().toISOString().split("T")[0];
  const makeId = () => Date.now() + Math.random();
  const formatEuro = (value) => `${Number(value || 0).toFixed(2)} €`;


  const normaliserOperation = (op) => {
    const factureTTC = Number(op.factureTTC || 0);
    const avoirTTC = Number(op.avoirTTC || 0);
    const netAPayer = Math.max(0, Number((factureTTC - avoirTTC).toFixed(2)));

    return {
      id: op.id || makeId(),
      date: op.date || today(),
      numeroFacture: op.numeroFacture || "",
      numeroAvoir: op.numeroAvoir || "",
      factureTTC,
      avoirTTC,
      netAPayer,
      source: op.source || "Manuel",
      nomFichier: op.nomFichier || "",
      notes: op.notes || "",
      archive: !!op.archive,
      datePaiement: op.datePaiement || "",
      modePaiement: op.modePaiement || "",
      statut: op.archive ? "Payée" : "En cours",
    };
  };

  const normaliserFournisseur = (f) => ({
    id: f.id || makeId(),
    nom: f.nom || "",
    telephone: f.telephone || "",
    email: f.email || "",
    adresse: f.adresse || "",
    operations: Array.isArray(f.operations)
      ? f.operations.map(normaliserOperation)
      : [],
  });

  const [fournisseurs, setFournisseurs] = useState([]);
  const loaded = useRef(false);

  const [recherche, setRecherche] = useState("");
  const [fournisseurActifId, setFournisseurActifId] = useState(null);

  const [modeEditionFournisseur, setModeEditionFournisseur] = useState(false);
  const [fournisseurEditionId, setFournisseurEditionId] = useState(null);

  const [formFournisseur, setFormFournisseur] = useState({
    nom: "",
    telephone: "",
    email: "",
    adresse: "",
  });

  const [formOperation, setFormOperation] = useState({
    date: today(),
    numeroFacture: "",
    numeroAvoir: "",
    factureTTC: "",
    avoirTTC: "",
    source: "Manuel",
    nomFichier: "",
    notes: "",
  });

  useEffect(() => {
    fetchStore("fournisseurs", []).then((data) => {
      setFournisseurs(Array.isArray(data) ? data : []);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    saveStore("fournisseurs", fournisseurs).catch(console.error);
  }, [fournisseurs]);

  const fournisseursFiltres = useMemo(() => {
    return fournisseurs.filter((f) => {
      const texte =
        `${f.nom} ${f.telephone} ${f.email} ${f.adresse}`.toLowerCase();
      return texte.includes(recherche.toLowerCase());
    });
  }, [fournisseurs, recherche]);

  const fournisseurActif =
    fournisseurs.find((f) => f.id === fournisseurActifId) ||
    fournisseursFiltres[0] ||
    null;

  const resetFormFournisseur = () => {
    setFormFournisseur({
      nom: "",
      telephone: "",
      email: "",
      adresse: "",
    });
    setModeEditionFournisseur(false);
    setFournisseurEditionId(null);
  };

  const resetFormOperation = () => {
    setFormOperation({
      date: today(),
      numeroFacture: "",
      numeroAvoir: "",
      factureTTC: "",
      avoirTTC: "",
      source: "Manuel",
      nomFichier: "",
      notes: "",
    });
  };

  const handleChangeFournisseur = (e) => {
    const { name, value } = e.target;
    setFormFournisseur((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangeOperation = (e) => {
    const { name, value } = e.target;
    setFormOperation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChoixFichier = (e) => {
    const file = e.target.files?.[0];
    setFormOperation((prev) => ({
      ...prev,
      nomFichier: file ? file.name : "",
    }));
  };

  const enregistrerFournisseur = (e) => {
    e.preventDefault();

    if (!formFournisseur.nom.trim()) {
      alert("Entre le nom du fournisseur.");
      return;
    }

    if (modeEditionFournisseur && fournisseurEditionId) {
      setFournisseurs((prev) =>
        prev.map((f) =>
          f.id === fournisseurEditionId ? { ...f, ...formFournisseur } : f
        )
      );
    } else {
      const nouveau = normaliserFournisseur({
        id: makeId(),
        ...formFournisseur,
        operations: [],
      });

      setFournisseurs((prev) => [...prev, nouveau]);
      setFournisseurActifId(nouveau.id);
    }

    resetFormFournisseur();
  };

  const modifierFournisseur = (f) => {
    setFormFournisseur({
      nom: f.nom || "",
      telephone: f.telephone || "",
      email: f.email || "",
      adresse: f.adresse || "",
    });
    setModeEditionFournisseur(true);
    setFournisseurEditionId(f.id);
    setFournisseurActifId(f.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const supprimerFournisseur = (id) => {
    const ok = window.confirm("Voulez-vous supprimer ce fournisseur ?");
    if (!ok) return;

    setFournisseurs((prev) => prev.filter((f) => f.id !== id));

    if (fournisseurActifId === id) {
      setFournisseurActifId(null);
    }

    if (fournisseurEditionId === id) {
      resetFormFournisseur();
    }
  };

  const ajouterOperation = (e) => {
    e.preventDefault();

    if (!fournisseurActif) {
      alert("Sélectionne d'abord un fournisseur.");
      return;
    }

    const factureTTC = Number(formOperation.factureTTC || 0);
    const avoirTTC = Number(formOperation.avoirTTC || 0);

    if (factureTTC <= 0 && avoirTTC <= 0) {
      alert("Entre au moins un montant de facture ou d'avoir.");
      return;
    }

    const nouvelleOperation = normaliserOperation({
      id: makeId(),
      date: formOperation.date,
      numeroFacture: formOperation.numeroFacture,
      numeroAvoir: formOperation.numeroAvoir,
      factureTTC,
      avoirTTC,
      source: formOperation.source,
      nomFichier: formOperation.nomFichier,
      notes: formOperation.notes,
      archive: false,
      datePaiement: "",
      modePaiement: "",
    });

    setFournisseurs((prev) =>
      prev.map((f) =>
        f.id === fournisseurActif.id
          ? { ...f, operations: [...f.operations, nouvelleOperation] }
          : f
      )
    );

    resetFormOperation();
  };

  const supprimerOperation = (operationId) => {
    if (!fournisseurActif) return;

    const ok = window.confirm("Voulez-vous supprimer cette ligne ?");
    if (!ok) return;

    setFournisseurs((prev) =>
      prev.map((f) =>
        f.id === fournisseurActif.id
          ? {
              ...f,
              operations: f.operations.filter((op) => op.id !== operationId),
            }
          : f
      )
    );
  };

  const confirmerPaiement = (operationId) => {
    if (!fournisseurActif) return;

    const mode = window.prompt(
      "Mode de paiement : Virement / Carte / Espèces / Chèque",
      "Virement"
    );

    if (mode === null) return;

    setFournisseurs((prev) =>
      prev.map((f) =>
        f.id === fournisseurActif.id
          ? {
              ...f,
              operations: f.operations.map((op) =>
                op.id === operationId
                  ? {
                      ...op,
                      archive: true,
                      statut: "Payée",
                      datePaiement: today(),
                      modePaiement: mode,
                    }
                  : op
              ),
            }
          : f
      )
    );
  };

  const remettreEnCours = (operationId) => {
    if (!fournisseurActif) return;

    setFournisseurs((prev) =>
      prev.map((f) =>
        f.id === fournisseurActif.id
          ? {
              ...f,
              operations: f.operations.map((op) =>
                op.id === operationId
                  ? {
                      ...op,
                      archive: false,
                      statut: "En cours",
                      datePaiement: "",
                      modePaiement: "",
                    }
                  : op
              ),
            }
          : f
      )
    );
  };

  const operationsEnCours = fournisseurActif
    ? fournisseurActif.operations
        .filter((op) => !op.archive)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const operationsArchivees = fournisseurActif
    ? fournisseurActif.operations
        .filter((op) => op.archive)
        .sort((a, b) => (b.datePaiement || "").localeCompare(a.datePaiement || ""))
    : [];

  const totalFacturesEnCours = operationsEnCours.reduce(
    (acc, op) => acc + Number(op.factureTTC || 0),
    0
  );

  const totalAvoirsEnCours = operationsEnCours.reduce(
    (acc, op) => acc + Number(op.avoirTTC || 0),
    0
  );

  const totalAPayer = Math.max(
    0,
    Number((totalFacturesEnCours - totalAvoirsEnCours).toFixed(2))
  );

  const totalArchive = operationsArchivees.reduce(
    (acc, op) => acc + Number(op.netAPayer || 0),
    0
  );

  const styles = {
    page: { width: "100%" },
    header: {
      background: "rgba(255,255,255,0.9)",
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
      margin: "8px 0 0 0",
      color: "#64748b",
    },
    card: {
      background: "#fff",
      borderRadius: 20,
      padding: 22,
      boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
      marginBottom: 20,
    },
    layout: {
      display: "grid",
      gridTemplateColumns: "340px 1fr",
      gap: 20,
      alignItems: "start",
    },
    input: {
      padding: "12px 14px",
      borderRadius: 12,
      border: "1px solid #cbd5e1",
      fontSize: 14,
      width: "100%",
      background: "#fff",
      outline: "none",
      boxSizing: "border-box",
    },
    formGrid2: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 12,
    },
    formGrid3: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 12,
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
    smallText: {
      color: "#64748b",
      fontSize: 13,
      marginTop: 6,
    },
    supplierItem: {
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: 14,
      background: "#f8fafc",
      marginBottom: 12,
      cursor: "pointer",
    },
    supplierItemActive: {
      border: "1px solid #d4af37",
      borderRadius: 16,
      padding: 14,
      background: "#fff8e1",
      marginBottom: 12,
      cursor: "pointer",
    },
    actionsRow: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 10,
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12,
      marginTop: 18,
    },
    summaryCard: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: 16,
    },
    tableWrap: {
      overflowX: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 10,
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
    badgeRed: {
      display: "inline-block",
      background: "#dc2626",
      color: "#fff",
      padding: "7px 12px",
      borderRadius: 999,
      fontWeight: "bold",
      fontSize: 12,
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
    badgeBlue: {
      display: "inline-block",
      background: "#2563eb",
      color: "#fff",
      padding: "7px 12px",
      borderRadius: 999,
      fontWeight: "bold",
      fontSize: 12,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p className="breadcrumb">Accueil / Fournisseurs</p>
        <h1 style={styles.title}>Gestion des fournisseurs</h1>
        <p style={styles.subtitle}>
          Facture et avoir saisis sur la même ligne, avec calcul direct du net à payer.
        </p>

        <div style={{ marginTop: 18 }}>
          <input
            style={{ ...styles.input, maxWidth: 320 }}
            placeholder="Rechercher un fournisseur..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.card}>
        <h3>{modeEditionFournisseur ? "Modifier fournisseur" : "Ajouter fournisseur"}</h3>

        <form onSubmit={enregistrerFournisseur} style={styles.formGrid2}>
          <input
            style={styles.input}
            name="nom"
            placeholder="Nom fournisseur / entreprise"
            value={formFournisseur.nom}
            onChange={handleChangeFournisseur}
            required
          />
          <input
            style={styles.input}
            name="telephone"
            placeholder="Téléphone"
            value={formFournisseur.telephone}
            onChange={handleChangeFournisseur}
          />
          <input
            style={styles.input}
            name="email"
            placeholder="Email"
            value={formFournisseur.email}
            onChange={handleChangeFournisseur}
          />
          <input
            style={styles.input}
            name="adresse"
            placeholder="Adresse"
            value={formFournisseur.adresse}
            onChange={handleChangeFournisseur}
          />

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" style={styles.buttonGold}>
              {modeEditionFournisseur ? "Mettre à jour" : "Enregistrer fournisseur"}
            </button>

            {modeEditionFournisseur && (
              <button
                type="button"
                style={styles.buttonDark}
                onClick={resetFormFournisseur}
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={styles.layout}>
        <aside style={styles.card}>
          <h3>Liste des fournisseurs</h3>

          {fournisseursFiltres.length === 0 ? (
            <p style={styles.smallText}>Aucun fournisseur enregistré.</p>
          ) : (
            fournisseursFiltres.map((f) => (
              <div
                key={f.id}
                style={
                  fournisseurActif && fournisseurActif.id === f.id
                    ? styles.supplierItemActive
                    : styles.supplierItem
                }
                onClick={() => setFournisseurActifId(f.id)}
              >
                <strong>{f.nom}</strong>
                <div style={styles.smallText}>{f.telephone || "-"}</div>
                <div style={styles.smallText}>{f.email || "-"}</div>

                <div style={styles.actionsRow}>
                  <button
                    style={styles.buttonDark}
                    onClick={(e) => {
                      e.stopPropagation();
                      modifierFournisseur(f);
                    }}
                  >
                    Modifier
                  </button>

                  <button
                    style={styles.buttonRed}
                    onClick={(e) => {
                      e.stopPropagation();
                      supprimerFournisseur(f.id);
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </aside>

        <section>
          {!fournisseurActif ? (
            <div style={styles.card}>
              <p style={styles.smallText}>
                Sélectionne un fournisseur pour voir ses opérations.
              </p>
            </div>
          ) : (
            <>
              <div style={styles.card}>
                <h2 style={{ marginTop: 0 }}>{fournisseurActif.nom}</h2>
                <p style={styles.smallText}>Téléphone : {fournisseurActif.telephone || "-"}</p>
                <p style={styles.smallText}>Email : {fournisseurActif.email || "-"}</p>
                <p style={styles.smallText}>Adresse : {fournisseurActif.adresse || "-"}</p>

                <div style={styles.summaryGrid}>
                  <div style={styles.summaryCard}>
                    <div style={styles.smallText}>Total factures en cours</div>
                    <strong>{formatEuro(totalFacturesEnCours)}</strong>
                  </div>

                  <div style={styles.summaryCard}>
                    <div style={styles.smallText}>Total avoirs en cours</div>
                    <strong>{formatEuro(totalAvoirsEnCours)}</strong>
                  </div>

                  <div style={styles.summaryCard}>
                    <div style={styles.smallText}>Total à payer</div>
                    <strong>{formatEuro(totalAPayer)}</strong>
                  </div>

                  <div style={styles.summaryCard}>
                    <div style={styles.smallText}>Total payé archivé</div>
                    <strong>{formatEuro(totalArchive)}</strong>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <h3>Ajouter facture + avoir sur la même ligne</h3>

                <form onSubmit={ajouterOperation} style={styles.formGrid3}>
                  <input
                    style={styles.input}
                    type="date"
                    name="date"
                    value={formOperation.date}
                    onChange={handleChangeOperation}
                  />

                  <input
                    style={styles.input}
                    name="numeroFacture"
                    placeholder="Numéro facture"
                    value={formOperation.numeroFacture}
                    onChange={handleChangeOperation}
                  />

                  <input
                    style={styles.input}
                    name="numeroAvoir"
                    placeholder="Numéro avoir"
                    value={formOperation.numeroAvoir}
                    onChange={handleChangeOperation}
                  />

                  <input
                    style={styles.input}
                    type="number"
                    step="0.01"
                    name="factureTTC"
                    placeholder="Montant facture TTC"
                    value={formOperation.factureTTC}
                    onChange={handleChangeOperation}
                  />

                  <input
                    style={styles.input}
                    type="number"
                    step="0.01"
                    name="avoirTTC"
                    placeholder="Montant avoir TTC"
                    value={formOperation.avoirTTC}
                    onChange={handleChangeOperation}
                  />

                  <select
                    style={styles.input}
                    name="source"
                    value={formOperation.source}
                    onChange={handleChangeOperation}
                  >
                    <option value="Manuel">Manuel</option>
                    <option value="Email">Email</option>
                    <option value="Portail fournisseur">Portail fournisseur</option>
                  </select>

                  <input
                    style={styles.input}
                    type="file"
                    onChange={handleChoixFichier}
                  />

                  <input
                    style={{ ...styles.input, gridColumn: "span 2" }}
                    name="notes"
                    placeholder="Notes"
                    value={formOperation.notes}
                    onChange={handleChangeOperation}
                  />

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button type="submit" style={styles.buttonGold}>
                      Ajouter
                    </button>
                    <button type="button" style={styles.buttonDark} onClick={resetFormOperation}>
                      Réinitialiser
                    </button>
                  </div>
                </form>

                <p style={styles.smallText}>
                  Exemple : facture 3000 € et avoir 500 € → net à payer 2500 €.
                </p>
              </div>

              <div style={styles.card}>
                <h3>Opérations en cours</h3>

                {operationsEnCours.length === 0 ? (
                  <p style={styles.smallText}>Aucune opération en cours.</p>
                ) : (
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Date</th>
                          <th style={styles.th}>N° facture</th>
                          <th style={styles.th}>N° avoir</th>
                          <th style={styles.th}>Facture TTC</th>
                          <th style={styles.th}>Avoir TTC</th>
                          <th style={styles.th}>Net à payer</th>
                          <th style={styles.th}>Source</th>
                          <th style={styles.th}>Fichier</th>
                          <th style={styles.th}>Statut</th>
                          <th style={styles.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operationsEnCours.map((op) => (
                          <tr key={op.id}>
                            <td style={styles.td}>{op.date}</td>
                            <td style={styles.td}>{op.numeroFacture || "-"}</td>
                            <td style={styles.td}>{op.numeroAvoir || "-"}</td>
                            <td style={styles.td}>{formatEuro(op.factureTTC)}</td>
                            <td style={styles.td}>{formatEuro(op.avoirTTC)}</td>
                            <td style={styles.td}>
                              <strong>{formatEuro(op.netAPayer)}</strong>
                            </td>
                            <td style={styles.td}>{op.source}</td>
                            <td style={styles.td}>{op.nomFichier || "-"}</td>
                            <td style={styles.td}>
                              <span style={styles.badgeRed}>En cours</span>
                            </td>
                            <td style={styles.td}>
                              <div style={styles.actionsRow}>
                                <button
                                  style={styles.buttonGreen}
                                  onClick={() => confirmerPaiement(op.id)}
                                >
                                  Confirmer paiement
                                </button>

                                <button
                                  style={styles.buttonRed}
                                  onClick={() => supprimerOperation(op.id)}
                                >
                                  Supprimer
                                </button>
                              </div>

                              {op.notes ? (
                                <div style={styles.smallText}>Notes : {op.notes}</div>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={styles.card}>
                <h3>Archives des paiements</h3>

                {operationsArchivees.length === 0 ? (
                  <p style={styles.smallText}>Aucune opération payée archivée.</p>
                ) : (
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Date</th>
                          <th style={styles.th}>N° facture</th>
                          <th style={styles.th}>N° avoir</th>
                          <th style={styles.th}>Facture TTC</th>
                          <th style={styles.th}>Avoir TTC</th>
                          <th style={styles.th}>Net payé</th>
                          <th style={styles.th}>Date paiement</th>
                          <th style={styles.th}>Mode paiement</th>
                          <th style={styles.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operationsArchivees.map((op) => (
                          <tr key={op.id}>
                            <td style={styles.td}>{op.date}</td>
                            <td style={styles.td}>{op.numeroFacture || "-"}</td>
                            <td style={styles.td}>{op.numeroAvoir || "-"}</td>
                            <td style={styles.td}>{formatEuro(op.factureTTC)}</td>
                            <td style={styles.td}>{formatEuro(op.avoirTTC)}</td>
                            <td style={styles.td}>
                              <strong>{formatEuro(op.netAPayer)}</strong>
                            </td>
                            <td style={styles.td}>{op.datePaiement || "-"}</td>
                            <td style={styles.td}>{op.modePaiement || "-"}</td>
                            <td style={styles.td}>
                              <button
                                style={styles.buttonDark}
                                onClick={() => remettreEnCours(op.id)}
                              >
                                Remettre en cours
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Fournisseurs;