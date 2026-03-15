import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchStore, saveStore } from "./api";

function Devis() {
  const today = () => new Date().toISOString().split("T")[0];

  const formatEuro = (value) => `${Number(value || 0).toFixed(2)} €`;

  const genererNumeroDevis = () => {
    const maintenant = new Date();
    const y = maintenant.getFullYear();
    const m = String(maintenant.getMonth() + 1).padStart(2, "0");
    const d = String(maintenant.getDate()).padStart(2, "0");
    const h = String(maintenant.getHours()).padStart(2, "0");
    const min = String(maintenant.getMinutes()).padStart(2, "0");
    return `DV/${y}/${m}${d}-${h}${min}`;
  };

  const marquesVoitures = [
    "Choisir une marque",
    "Audi",
    "BMW",
    "Citroën",
    "Dacia",
    "Fiat",
    "Ford",
    "Honda",
    "Hyundai",
    "Kia",
    "Mercedes",
    "Nissan",
    "Opel",
    "Peugeot",
    "Renault",
    "Seat",
    "Skoda",
    "Toyota",
    "Volkswagen",
    "Volvo",
  ];

  const [devisEnregistres, setDevisEnregistres] = useState([]);
  const loaded = useRef(false);
  const [devisOuvert, setDevisOuvert] = useState(null);

  const [infosClient, setInfosClient] = useState({
    nomClient: "",
    marque: "Choisir une marque",
    modele: "",
    immatriculation: "",
    dateDevis: today(),
    numeroDevis: genererNumeroDevis(),
  });

  const [ligneForm, setLigneForm] = useState({
    designation: "",
    reference: "",
    quantite: 1,
    prixTTC: "",
  });

  const [lignes, setLignes] = useState([]);
  const [remiseTTC, setRemiseTTC] = useState(0);
  const [devisEditionId, setDevisEditionId] = useState(null);

  useEffect(() => {
    fetchStore("devis_enregistres", []).then((data) => {
      setDevisEnregistres(Array.isArray(data) ? data : []);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    saveStore("devis_enregistres", devisEnregistres).catch(console.error);
  }, [devisEnregistres]);

  const totalLigneTTC = (ligne) => {
    const qte = Number(ligne.quantite || 0);
    const prix = Number(ligne.prixTTC || 0);
    return qte * prix;
  };

  const sousTotalTTC = useMemo(
    () =>
      lignes.reduce((acc, ligne) => {
        return acc + totalLigneTTC(ligne);
      }, 0),
    [lignes]
  );

  const totalTTC = Math.max(0, sousTotalTTC - Number(remiseTTC || 0));

  const ajouterLigne = () => {
    if (!ligneForm.designation.trim()) {
      alert("Entre la désignation de la pièce.");
      return;
    }

    const nouvelleLigne = {
      id: Date.now() + Math.random(),
      designation: ligneForm.designation,
      reference: ligneForm.reference,
      quantite: Number(ligneForm.quantite || 1),
      prixTTC: Number(ligneForm.prixTTC || 0),
    };

    setLignes((prev) => [...prev, nouvelleLigne]);

    setLigneForm({
      designation: "",
      reference: "",
      quantite: 1,
      prixTTC: "",
    });
  };

  const supprimerLigne = (id) => {
    setLignes((prev) => prev.filter((ligne) => ligne.id !== id));
  };

  const resetDevis = () => {
    setInfosClient({
      nomClient: "",
      marque: "Choisir une marque",
      modele: "",
      immatriculation: "",
      dateDevis: today(),
      numeroDevis: genererNumeroDevis(),
    });
    setLigneForm({
      designation: "",
      reference: "",
      quantite: 1,
      prixTTC: "",
    });
    setLignes([]);
    setRemiseTTC(0);
    setDevisEditionId(null);
    setDevisOuvert(null);
  };

  const enregistrerDevis = () => {
    if (!infosClient.nomClient.trim()) {
      alert("Entre le nom du client.");
      return;
    }

    if (lignes.length === 0) {
      alert("Ajoute au moins une pièce au devis.");
      return;
    }

    const devis = {
      id: devisEditionId || Date.now(),
      infosClient,
      lignes,
      remiseTTC: Number(remiseTTC || 0),
      sousTotalTTC,
      totalTTC,
    };

    if (devisEditionId) {
      setDevisEnregistres((prev) => prev.map((d) => (d.id === devisEditionId ? devis : d)));
      setDevisOuvert(devis);
    } else {
      setDevisEnregistres((prev) => [devis, ...prev]);
      setDevisOuvert(devis);
    }

    alert("Devis enregistré avec succès.");
  };

  const chargerDevis = (devis) => {
    setInfosClient(devis.infosClient);
    setLignes(devis.lignes || []);
    setRemiseTTC(devis.remiseTTC || 0);
    setDevisEditionId(devis.id);
    setDevisOuvert(devis);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const supprimerDevis = (id) => {
    const ok = window.confirm("Voulez-vous supprimer ce devis ?");
    if (!ok) return;
    setDevisEnregistres((prev) => prev.filter((d) => d.id !== id));
    if (devisOuvert?.id === id) {
      setDevisOuvert(null);
    }
  };

  const imprimerDevisCourant = () => {
    window.print();
  };

  const imprimerDevisSauvegarde = (devis) => {
    setInfosClient(devis.infosClient);
    setLignes(devis.lignes || []);
    setRemiseTTC(devis.remiseTTC || 0);
    setDevisEditionId(devis.id);
    setDevisOuvert(devis);

    setTimeout(() => {
      window.print();
    }, 250);
  };

  const devisAffiche = devisOuvert || {
    infosClient,
    lignes,
    remiseTTC,
    sousTotalTTC,
    totalTTC,
  };

  const styles = {
    page: {
      width: "100%",
    },
    printStyle: `
      @page {
        size: A4;
        margin: 14mm;
      }

      @media print {
        body * {
          visibility: hidden;
        }

        .devis-print-only,
        .devis-print-only * {
          visibility: visible;
        }

        .devis-print-only {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white;
          padding: 0;
          margin: 0;
        }

        .devis-no-print {
          display: none !important;
        }
      }
    `,
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
      fontSize: 15,
    },
    section: {
      background: "#fff",
      borderRadius: 20,
      padding: 22,
      boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
      marginBottom: 20,
    },
    sectionTitle: {
      margin: "0 0 18px 0",
      fontSize: 24,
      color: "#0f172a",
    },
    formGrid6: {
      display: "grid",
      gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
      gap: 12,
    },
    formGrid5: {
      display: "grid",
      gridTemplateColumns: "2fr 1.2fr 0.8fr 1fr 1fr auto",
      gap: 12,
      alignItems: "center",
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
    },
    buttonGold: {
      background: "linear-gradient(90deg, #d4af37, #f4d26b)",
      color: "#111827",
      border: "none",
      borderRadius: 12,
      padding: "12px 18px",
      fontWeight: "bold",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    buttonDark: {
      background: "#0f172a",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "11px 16px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    buttonRed: {
      background: "#dc2626",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "11px 16px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    buttonGreen: {
      background: "#16a34a",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "11px 16px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    buttonOrange: {
      background: "#f59e0b",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "11px 16px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    tableWrap: {
      overflowX: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 10,
      minWidth: 900,
    },
    th: {
      textAlign: "left",
      padding: 14,
      borderBottom: "1px solid #e2e8f0",
      background: "#f8fafc",
      fontSize: 14,
      whiteSpace: "nowrap",
    },
    td: {
      padding: 14,
      borderBottom: "1px solid #e2e8f0",
      fontSize: 14,
      verticalAlign: "middle",
    },
    totalsBox: {
      display: "grid",
      gridTemplateColumns: "1fr 340px",
      gap: 20,
      alignItems: "start",
    },
    totalsCard: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 18,
      padding: 20,
    },
    totalLine: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      padding: "10px 0",
      borderBottom: "1px solid #e2e8f0",
    },
    totalFinal: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      paddingTop: 14,
      fontSize: 22,
      fontWeight: 800,
      color: "#0f172a",
    },
    actionsRow: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
    },
    savedCard: {
      border: "1px solid #e2e8f0",
      background: "#fff",
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      cursor: "pointer",
    },
    savedTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: 16,
      alignItems: "center",
      flexWrap: "wrap",
    },
    savedMeta: {
      color: "#64748b",
      fontSize: 14,
      marginTop: 6,
    },

    printPage: {
      width: "100%",
      minHeight: "100vh",
      background: "#fff",
      color: "#111",
      padding: "10px 18px 18px 18px",
      fontFamily: "Arial, sans-serif",
    },
    printTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottom: "2px solid #222",
      paddingBottom: 12,
      marginBottom: 28,
    },
    printCompanyLeft: {
      maxWidth: "52%",
    },
    printLogo: {
      width: 70,
      height: 70,
      objectFit: "contain",
      marginBottom: 8,
    },
    printCompanyName: {
      fontSize: 18,
      fontWeight: 800,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    printCompanyText: {
      fontSize: 15,
      lineHeight: 1.5,
      margin: 0,
    },
    printClientBox: {
      minWidth: 260,
      textAlign: "left",
      marginTop: 24,
    },
    printClientName: {
      fontSize: 17,
      fontWeight: 700,
      marginBottom: 6,
    },
    printDocTitle: {
      fontSize: 28,
      color: "#caa33b",
      margin: "18px 0 24px 0",
      fontWeight: 400,
    },
    printInfosRow: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 20,
      marginBottom: 28,
    },
    printInfoLabel: {
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 6,
    },
    printInfoValue: {
      fontSize: 15,
    },
    printTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 10,
      marginBottom: 24,
    },
    printTh: {
      textAlign: "left",
      padding: "10px 8px",
      fontSize: 15,
      borderBottom: "2px solid #222",
    },
    printTd: {
      textAlign: "left",
      padding: "10px 8px",
      fontSize: 15,
      borderBottom: "1px solid #ddd",
    },
    printTotalsWrap: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: 12,
    },
    printTotalsTable: {
      width: 380,
      borderCollapse: "collapse",
    },
    printTotalsLabel: {
      padding: "8px 6px",
      fontSize: 15,
      borderBottom: "1px solid #222",
      fontWeight: 700,
    },
    printTotalsValue: {
      padding: "8px 6px",
      fontSize: 15,
      borderBottom: "1px solid #222",
      textAlign: "right",
      fontWeight: 700,
    },
    printFooterText: {
      marginTop: 46,
      fontSize: 14,
    },
    printBottomLine: {
      borderTop: "2px solid #222",
      marginTop: 80,
      paddingTop: 12,
      textAlign: "center",
      fontSize: 14,
      lineHeight: 1.8,
    },
  };

  return (
    <div style={styles.page}>
      <style>{styles.printStyle}</style>

      <div style={styles.header} className="devis-no-print">
        <p className="breadcrumb">Accueil / Devis</p>
        <h1 style={styles.title}>Créer un devis</h1>
        <p style={styles.subtitle}>
          Prépare un devis propre et professionnel pour ton client.
        </p>
      </div>

      <div className="devis-no-print">
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Informations client</h3>

          <div style={styles.formGrid6}>
            <input
              style={styles.input}
              placeholder="Nom client"
              value={infosClient.nomClient}
              onChange={(e) =>
                setInfosClient((prev) => ({ ...prev, nomClient: e.target.value }))
              }
            />

            <select
              style={styles.input}
              value={infosClient.marque}
              onChange={(e) =>
                setInfosClient((prev) => ({ ...prev, marque: e.target.value }))
              }
            >
              {marquesVoitures.map((marque) => (
                <option key={marque} value={marque}>
                  {marque}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              placeholder="Modèle voiture"
              value={infosClient.modele}
              onChange={(e) =>
                setInfosClient((prev) => ({ ...prev, modele: e.target.value }))
              }
            />

            <input
              style={styles.input}
              placeholder="Immatriculation"
              value={infosClient.immatriculation}
              onChange={(e) =>
                setInfosClient((prev) => ({ ...prev, immatriculation: e.target.value }))
              }
            />

            <input
              style={styles.input}
              type="date"
              value={infosClient.dateDevis}
              onChange={(e) =>
                setInfosClient((prev) => ({ ...prev, dateDevis: e.target.value }))
              }
            />

            <input
              style={{ ...styles.input, background: "#f8fafc", fontWeight: "bold" }}
              value={infosClient.numeroDevis}
              readOnly
            />
          </div>
        </div>

        <div style={{ ...styles.section }}>
          <h3 style={styles.sectionTitle}>Ajouter une pièce</h3>

          <div style={styles.formGrid5}>
            <input
              style={styles.input}
              placeholder="Désignation pièce"
              value={ligneForm.designation}
              onChange={(e) =>
                setLigneForm((prev) => ({ ...prev, designation: e.target.value }))
              }
            />

            <input
              style={styles.input}
              placeholder="Référence"
              value={ligneForm.reference}
              onChange={(e) =>
                setLigneForm((prev) => ({ ...prev, reference: e.target.value }))
              }
            />

            <input
              style={styles.input}
              type="number"
              min="1"
              placeholder="Qté"
              value={ligneForm.quantite}
              onChange={(e) =>
                setLigneForm((prev) => ({ ...prev, quantite: e.target.value }))
              }
            />

            <input
              style={styles.input}
              type="number"
              step="0.01"
              placeholder="Prix vente TTC"
              value={ligneForm.prixTTC}
              onChange={(e) =>
                setLigneForm((prev) => ({ ...prev, prixTTC: e.target.value }))
              }
            />

            <input
              style={{ ...styles.input, background: "#f8fafc", fontWeight: "bold" }}
              value={formatEuro(totalLigneTTC(ligneForm))}
              readOnly
            />

            <button type="button" style={styles.buttonGold} onClick={ajouterLigne}>
              Ajouter pièce
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Pièces du devis</h3>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Désignation</th>
                  <th style={styles.th}>Référence</th>
                  <th style={styles.th}>Quantité</th>
                  <th style={styles.th}>Prix vente TTC</th>
                  <th style={styles.th}>Total ligne</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lignes.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan="6">
                      Aucune pièce ajoutée au devis.
                    </td>
                  </tr>
                ) : (
                  lignes.map((ligne) => (
                    <tr key={ligne.id}>
                      <td style={styles.td}>{ligne.designation}</td>
                      <td style={styles.td}>{ligne.reference || "-"}</td>
                      <td style={styles.td}>{ligne.quantite}</td>
                      <td style={styles.td}>{formatEuro(ligne.prixTTC)}</td>
                      <td style={styles.td}>
                        <strong>{formatEuro(totalLigneTTC(ligne))}</strong>
                      </td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.buttonRed}
                          onClick={() => supprimerLigne(ligne.id)}
                        >
                          Supprimer ligne
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Totaux</h3>

          <div style={styles.totalsBox}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
                Remise TTC
              </label>
              <input
                style={{ ...styles.input, maxWidth: 240 }}
                type="number"
                step="0.01"
                value={remiseTTC}
                onChange={(e) => setRemiseTTC(e.target.value)}
              />
            </div>

            <div style={styles.totalsCard}>
              <div style={styles.totalLine}>
                <span>Sous total TTC</span>
                <strong>{formatEuro(sousTotalTTC)}</strong>
              </div>
              <div style={styles.totalLine}>
                <span>Remise TTC</span>
                <strong>{formatEuro(remiseTTC)}</strong>
              </div>
              <div style={styles.totalFinal}>
                <span>Total TTC</span>
                <span>{formatEuro(totalTTC)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Actions</h3>

          <div style={styles.actionsRow}>
            <button type="button" style={styles.buttonGreen} onClick={enregistrerDevis}>
              {devisEditionId ? "Mettre à jour le devis" : "Enregistrer le devis"}
            </button>

            <button type="button" style={styles.buttonOrange} onClick={imprimerDevisCourant}>
              Imprimer le devis courant
            </button>

            <button type="button" style={styles.buttonDark} onClick={resetDevis}>
              Nouveau devis
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Devis enregistrés</h3>

          {devisEnregistres.length === 0 ? (
            <p style={{ color: "#64748b", margin: 0 }}>Aucun devis enregistré.</p>
          ) : (
            devisEnregistres.map((devis) => (
              <div
                key={devis.id}
                style={styles.savedCard}
                onClick={() => chargerDevis(devis)}
              >
                <div style={styles.savedTop}>
                  <div>
                    <strong>{devis.infosClient.numeroDevis}</strong>
                    <div style={styles.savedMeta}>
                      {devis.infosClient.nomClient} • {devis.infosClient.dateDevis} •{" "}
                      {formatEuro(devis.totalTTC)}
                    </div>
                  </div>

                  <div style={styles.actionsRow}>
                    <button
                      type="button"
                      style={styles.buttonDark}
                      onClick={(e) => {
                        e.stopPropagation();
                        chargerDevis(devis);
                      }}
                    >
                      Ouvrir
                    </button>

                    <button
                      type="button"
                      style={styles.buttonOrange}
                      onClick={(e) => {
                        e.stopPropagation();
                        imprimerDevisSauvegarde(devis);
                      }}
                    >
                      Imprimer
                    </button>

                    <button
                      type="button"
                      style={styles.buttonRed}
                      onClick={(e) => {
                        e.stopPropagation();
                        supprimerDevis(devis.id);
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {devisOuvert && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Détail du devis sélectionné</h3>

            <div style={{ marginBottom: 16, lineHeight: 1.9 }}>
              <div>
                <strong>Numéro devis :</strong> {devisOuvert.infosClient.numeroDevis}
              </div>
              <div>
                <strong>Client :</strong> {devisOuvert.infosClient.nomClient}
              </div>
              <div>
                <strong>Marque :</strong> {devisOuvert.infosClient.marque}
              </div>
              <div>
                <strong>Modèle :</strong> {devisOuvert.infosClient.modele}
              </div>
              <div>
                <strong>Immatriculation :</strong> {devisOuvert.infosClient.immatriculation}
              </div>
              <div>
                <strong>Date :</strong> {devisOuvert.infosClient.dateDevis}
              </div>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Désignation</th>
                    <th style={styles.th}>Référence</th>
                    <th style={styles.th}>Quantité</th>
                    <th style={styles.th}>Prix vente TTC</th>
                    <th style={styles.th}>Total ligne</th>
                  </tr>
                </thead>
                <tbody>
                  {(devisOuvert.lignes || []).map((ligne) => (
                    <tr key={ligne.id}>
                      <td style={styles.td}>{ligne.designation}</td>
                      <td style={styles.td}>{ligne.reference || "-"}</td>
                      <td style={styles.td}>{ligne.quantite}</td>
                      <td style={styles.td}>{formatEuro(ligne.prixTTC)}</td>
                      <td style={styles.td}>
                        <strong>{formatEuro(totalLigneTTC(ligne))}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 18, lineHeight: 1.9 }}>
              <div>
                <strong>Sous total TTC :</strong> {formatEuro(devisOuvert.sousTotalTTC)}
              </div>
              <div>
                <strong>Remise TTC :</strong> {formatEuro(devisOuvert.remiseTTC)}
              </div>
              <div>
                <strong>Total TTC :</strong> {formatEuro(devisOuvert.totalTTC)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="devis-print-only" style={styles.printPage}>
        <div style={styles.printTop}>
          <div style={styles.printCompanyLeft}>
            <div style={{ fontWeight: "700", fontSize: "20px" }}>King Pieces Autos</div>
            <div style={styles.printCompanyName}>THE KING PIECES AUTOS</div>
            <p style={styles.printCompanyText}>32 AVENUE MARCEL CACHIN</p>
            <p style={styles.printCompanyText}>93240 STAINS France</p>
            <p style={styles.printCompanyText}>0184741500 - thekingpieces@gmail.com</p>
          </div>

          <div style={styles.printClientBox}>
            <div style={styles.printClientName}>
              {devisAffiche.infosClient?.nomClient || "-"}
            </div>
            <div style={styles.printCompanyText}>
              {devisAffiche.infosClient?.marque || "-"}{" "}
              {devisAffiche.infosClient?.modele || ""}
            </div>
            <div style={styles.printCompanyText}>
              {devisAffiche.infosClient?.immatriculation || "-"}
            </div>
          </div>
        </div>

        <div style={styles.printDocTitle}>
          Devis {devisAffiche.infosClient?.numeroDevis || "-"}
        </div>

        <div style={styles.printInfosRow}>
          <div>
            <div style={styles.printInfoLabel}>Date du devis :</div>
            <div style={styles.printInfoValue}>
              {devisAffiche.infosClient?.dateDevis || "-"}
            </div>
          </div>

          <div>
            <div style={styles.printInfoLabel}>Client :</div>
            <div style={styles.printInfoValue}>
              {devisAffiche.infosClient?.nomClient || "-"}
            </div>
          </div>

          <div>
            <div style={styles.printInfoLabel}>Véhicule :</div>
            <div style={styles.printInfoValue}>
              {devisAffiche.infosClient?.marque || "-"}{" "}
              {devisAffiche.infosClient?.modele || ""}
            </div>
          </div>

          <div>
            <div style={styles.printInfoLabel}>Immatriculation :</div>
            <div style={styles.printInfoValue}>
              {devisAffiche.infosClient?.immatriculation || "-"}
            </div>
          </div>
        </div>

        <table style={styles.printTable}>
          <thead>
            <tr>
              <th style={styles.printTh}>Description</th>
              <th style={styles.printTh}>Quantité</th>
              <th style={styles.printTh}>Prix unitaire TTC</th>
              <th style={styles.printTh}>Prix total</th>
            </tr>
          </thead>
          <tbody>
            {(devisAffiche.lignes || []).map((ligne) => (
              <tr key={ligne.id}>
                <td style={styles.printTd}>
                  {ligne.designation}
                  {ligne.reference ? ` (${ligne.reference})` : ""}
                </td>
                <td style={styles.printTd}>{ligne.quantite}</td>
                <td style={styles.printTd}>{formatEuro(ligne.prixTTC)}</td>
                <td style={styles.printTd}>
                  <strong>{formatEuro(totalLigneTTC(ligne))}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.printTotalsWrap}>
          <table style={styles.printTotalsTable}>
            <tbody>
              <tr>
                <td style={styles.printTotalsLabel}>Sous total TTC</td>
                <td style={styles.printTotalsValue}>
                  {formatEuro(devisAffiche.sousTotalTTC)}
                </td>
              </tr>
              <tr>
                <td style={styles.printTotalsLabel}>Remise TTC</td>
                <td style={styles.printTotalsValue}>
                  {formatEuro(devisAffiche.remiseTTC)}
                </td>
              </tr>
              <tr>
                <td style={styles.printTotalsLabel}>Total</td>
                <td style={styles.printTotalsValue}>
                  {formatEuro(devisAffiche.totalTTC)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={styles.printFooterText}>
          Merci pour votre confiance. Ce devis est valable selon les conditions convenues.
        </div>

        <div style={styles.printBottomLine}>
          THE KING PIECES AUTOS - 32 AVENUE MARCEL CACHIN - 93240 STAINS France
          <br />
          0184741500 - thekingpieces@gmail.com
        </div>
      </div>
    </div>
  );
}


export default Devis;
