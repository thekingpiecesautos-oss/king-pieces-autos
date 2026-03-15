import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchStore, saveStore } from "./api";

function Finances() {
  const today = () => new Date().toISOString().split("T")[0];
  const makeId = () => Date.now() + Math.random();
  const euro = (value) => `${Number(value || 0).toFixed(2)} €`;

  const defaultData = { cheques: [], virements: [], especes: [], depots: [] };
  const loaded = useRef(false);

  const normalizeCheque = (item) => ({
    id: item.id || makeId(),
    date: item.date || today(),
    nom: item.nom || "",
    numeroFacture: item.numeroFacture || "",
    montant: Number(item.montant || 0),
    photoCheque: item.photoCheque || "",
  });

  const normalizeVirement = (item) => ({
    id: item.id || makeId(),
    date: item.date || today(),
    nom: item.nom || "",
    numeroFacture: item.numeroFacture || "",
    montant: Number(item.montant || 0),
  });

  const normalizeEspece = (item) => ({
    id: item.id || makeId(),
    date: item.date || today(),
    numeroFacture: item.numeroFacture || "",
    montant: Number(item.montant || 0),
  });

  const normalizeDepotLine = (line) => ({
    id: line.id || makeId(),
    numeroFacture: line.numeroFacture || "",
    montant: Number(line.montant || 0),
  });

  const normalizeDepot = (item) => {
    const lignes = Array.isArray(item.lignes) ? item.lignes.map(normalizeDepotLine) : [];
    const totalFactures = lignes.reduce((acc, line) => acc + Number(line.montant || 0), 0);
    const montantDepot = Number(item.montantDepot || 0);

    return {
      id: item.id || makeId(),
      dateDepot: item.dateDepot || today(),
      montantDepot,
      lignes,
      totalFactures: Number(totalFactures.toFixed(2)),
      reste: Number((montantDepot - totalFactures).toFixed(2)),
      statut:
        Number(totalFactures.toFixed(2)) === Number(montantDepot.toFixed(2))
          ? "Clôturé"
          : "En cours",
    };
  };

  const [cheques, setCheques] = useState([]);
  const [virements, setVirements] = useState([]);
  const [especes, setEspeces] = useState([]);
  const [depots, setDepots] = useState([]);

  const [chequeEditId, setChequeEditId] = useState(null);
  const [virementEditId, setVirementEditId] = useState(null);
  const [especeEditId, setEspeceEditId] = useState(null);

  const [depotActifId, setDepotActifId] = useState(null);
  const [depotEditId, setDepotEditId] = useState(null);

  const [formCheque, setFormCheque] = useState({
    date: today(),
    nom: "",
    numeroFacture: "",
    montant: "",
    photoCheque: "",
  });

  const [formVirement, setFormVirement] = useState({
    date: today(),
    nom: "",
    numeroFacture: "",
    montant: "",
  });

  const [formEspece, setFormEspece] = useState({
    date: today(),
    numeroFacture: "",
    montant: "",
  });

  const [formDepot, setFormDepot] = useState({
    dateDepot: today(),
    montantDepot: "",
  });

  const [formDepotLine, setFormDepotLine] = useState({
    numeroFacture: "",
    montant: "",
  });

  useEffect(() => {
    fetchStore("finances_data", defaultData).then((data) => {
      const source = data || defaultData;
      setCheques(Array.isArray(source.cheques) ? source.cheques.map(normalizeCheque) : []);
      setVirements(Array.isArray(source.virements) ? source.virements.map(normalizeVirement) : []);
      setEspeces(Array.isArray(source.especes) ? source.especes.map(normalizeEspece) : []);
      setDepots(Array.isArray(source.depots) ? source.depots.map(normalizeDepot) : []);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    saveStore("finances_data", { cheques, virements, especes, depots }).catch(console.error);
  }, [cheques, virements, especes, depots]);

  const depotActif =
    depots.find((item) => item.id === depotActifId) ||
    depots.find((item) => item.statut === "En cours") ||
    null;

  const totalCheques = useMemo(
    () => cheques.reduce((acc, item) => acc + Number(item.montant || 0), 0),
    [cheques]
  );

  const totalVirements = useMemo(
    () => virements.reduce((acc, item) => acc + Number(item.montant || 0), 0),
    [virements]
  );

  const totalEspeces = useMemo(
    () => especes.reduce((acc, item) => acc + Number(item.montant || 0), 0),
    [especes]
  );

  const totalDepots = useMemo(
    () => depots.reduce((acc, item) => acc + Number(item.montantDepot || 0), 0),
    [depots]
  );

  const totalEncaisse = totalCheques + totalVirements + totalEspeces;

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
    grid4: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12,
      marginBottom: 20,
    },
    grid3: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 12,
    },
    summaryCard: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: 16,
    },
    smallText: {
      color: "#64748b",
      fontSize: 13,
      marginTop: 6,
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
    formGrid5: {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 12,
    },
    formGrid4: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
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
    actionsRow: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
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
    lineBox: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: 16,
      marginTop: 14,
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
  };

  const resetChequeForm = () => {
    setFormCheque({
      date: today(),
      nom: "",
      numeroFacture: "",
      montant: "",
      photoCheque: "",
    });
    setChequeEditId(null);
  };

  const resetVirementForm = () => {
    setFormVirement({
      date: today(),
      nom: "",
      numeroFacture: "",
      montant: "",
    });
    setVirementEditId(null);
  };

  const resetEspeceForm = () => {
    setFormEspece({
      date: today(),
      numeroFacture: "",
      montant: "",
    });
    setEspeceEditId(null);
  };

  const resetDepotForm = () => {
    setFormDepot({
      dateDepot: today(),
      montantDepot: "",
    });
    setDepotEditId(null);
  };

  const resetDepotLineForm = () => {
    setFormDepotLine({
      numeroFacture: "",
      montant: "",
    });
  };

  const addOrUpdateCheque = (e) => {
    e.preventDefault();

    if (!formCheque.numeroFacture.trim()) {
      alert("Entre le numéro de facture.");
      return;
    }

    const item = normalizeCheque({
      id: chequeEditId || makeId(),
      ...formCheque,
    });

    if (chequeEditId) {
      setCheques((prev) => prev.map((c) => (c.id === chequeEditId ? item : c)));
    } else {
      setCheques((prev) => [...prev, item]);
    }

    resetChequeForm();
  };

  const addOrUpdateVirement = (e) => {
    e.preventDefault();

    if (!formVirement.numeroFacture.trim()) {
      alert("Entre le numéro de facture.");
      return;
    }

    const item = normalizeVirement({
      id: virementEditId || makeId(),
      ...formVirement,
    });

    if (virementEditId) {
      setVirements((prev) => prev.map((v) => (v.id === virementEditId ? item : v)));
    } else {
      setVirements((prev) => [...prev, item]);
    }

    resetVirementForm();
  };

  const addOrUpdateEspece = (e) => {
    e.preventDefault();

    if (!formEspece.numeroFacture.trim()) {
      alert("Entre le numéro de facture.");
      return;
    }

    const item = normalizeEspece({
      id: especeEditId || makeId(),
      ...formEspece,
    });

    if (especeEditId) {
      setEspeces((prev) => prev.map((x) => (x.id === especeEditId ? item : x)));
    } else {
      setEspeces((prev) => [...prev, item]);
    }

    resetEspeceForm();
  };

  const saveDepot = (e) => {
    e.preventDefault();

    const montantDepot = Number(formDepot.montantDepot || 0);

    if (montantDepot <= 0) {
      alert("Entre le montant du dépôt.");
      return;
    }

    const currentLines =
      depotEditId && depotActif && depotActif.id === depotEditId ? depotActif.lignes || [] : [];

    const item = normalizeDepot({
      id: depotEditId || makeId(),
      dateDepot: formDepot.dateDepot,
      montantDepot,
      lignes: currentLines,
    });

    if (depotEditId) {
      setDepots((prev) => prev.map((d) => (d.id === depotEditId ? item : d)));
      setDepotActifId(item.id);
    } else {
      setDepots((prev) => [...prev, item]);
      setDepotActifId(item.id);
    }

    resetDepotForm();
  };

  const openDepot = (item) => {
    setDepotActifId(item.id);
    setFormDepot({
      dateDepot: item.dateDepot,
      montantDepot: item.montantDepot,
    });
    setDepotEditId(item.id);
    resetDepotLineForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addLineToDepot = () => {
    if (!depotActif) {
      alert("Enregistre ou ouvre d'abord un dépôt.");
      return;
    }

    if (!formDepotLine.numeroFacture.trim()) {
      alert("Entre le numéro de facture.");
      return;
    }

    if (Number(formDepotLine.montant || 0) <= 0) {
      alert("Entre le montant de la facture.");
      return;
    }

    const nouvelleLigne = normalizeDepotLine({
      id: makeId(),
      numeroFacture: formDepotLine.numeroFacture,
      montant: formDepotLine.montant,
    });

    setDepots((prev) =>
      prev.map((depot) => {
        if (depot.id !== depotActif.id) return depot;

        const lignes = [...(depot.lignes || []), nouvelleLigne];
        return normalizeDepot({
          ...depot,
          lignes,
        });
      })
    );

    resetDepotLineForm();
  };

  const removeLineFromDepot = (lineId) => {
    if (!depotActif) return;

    setDepots((prev) =>
      prev.map((depot) => {
        if (depot.id !== depotActif.id) return depot;

        const lignes = (depot.lignes || []).filter((line) => line.id !== lineId);
        return normalizeDepot({
          ...depot,
          lignes,
        });
      })
    );
  };

  const cloturerDepot = (depotId) => {
    const depot = depots.find((item) => item.id === depotId);
    if (!depot) return;

    if (Number(depot.reste.toFixed(2)) !== 0) {
      alert("Le dépôt ne peut pas être clôturé tant que le reste n'est pas à 0.");
      return;
    }

    setDepots((prev) =>
      prev.map((item) =>
        item.id === depotId
          ? {
              ...item,
              statut: "Clôturé",
            }
          : item
      )
    );
  };

  const reouvrirDepot = (depotId) => {
    setDepots((prev) =>
      prev.map((item) =>
        item.id === depotId
          ? {
              ...item,
              statut: "En cours",
            }
          : item
      )
    );
  };

  const deleteCheque = (id) => {
    const ok = window.confirm("Voulez-vous supprimer ce chèque ?");
    if (!ok) return;
    setCheques((prev) => prev.filter((item) => item.id !== id));
    if (chequeEditId === id) resetChequeForm();
  };

  const deleteVirement = (id) => {
    const ok = window.confirm("Voulez-vous supprimer ce virement ?");
    if (!ok) return;
    setVirements((prev) => prev.filter((item) => item.id !== id));
    if (virementEditId === id) resetVirementForm();
  };

  const deleteEspece = (id) => {
    const ok = window.confirm("Voulez-vous supprimer cette ligne espèces ?");
    if (!ok) return;
    setEspeces((prev) => prev.filter((item) => item.id !== id));
    if (especeEditId === id) resetEspeceForm();
  };

  const deleteDepot = (id) => {
    const ok = window.confirm("Voulez-vous supprimer ce dépôt ?");
    if (!ok) return;

    setDepots((prev) => prev.filter((item) => item.id !== id));

    if (depotActifId === id) {
      setDepotActifId(null);
      resetDepotForm();
      resetDepotLineForm();
    }
  };

  const editCheque = (item) => {
    setFormCheque({
      date: item.date,
      nom: item.nom,
      numeroFacture: item.numeroFacture,
      montant: item.montant,
      photoCheque: item.photoCheque || "",
    });
    setChequeEditId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editVirement = (item) => {
    setFormVirement({
      date: item.date,
      nom: item.nom,
      numeroFacture: item.numeroFacture,
      montant: item.montant,
    });
    setVirementEditId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editEspece = (item) => {
    setFormEspece({
      date: item.date,
      numeroFacture: item.numeroFacture,
      montant: item.montant,
    });
    setEspeceEditId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChequeFile = (e) => {
    const file = e.target.files?.[0];
    setFormCheque((prev) => ({
      ...prev,
      photoCheque: file ? file.name : "",
    }));
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p className="breadcrumb">Accueil / Finances</p>
        <h1 style={styles.title}>Finances</h1>
        <p style={styles.subtitle}>
          Chèques, virements, espèces et dépôts banque espèces.
        </p>
      </div>

      <div style={styles.grid4}>
        <div style={styles.summaryCard}>
          <div style={styles.smallText}>Total chèques</div>
          <strong>{euro(totalCheques)}</strong>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.smallText}>Total virements</div>
          <strong>{euro(totalVirements)}</strong>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.smallText}>Total espèces</div>
          <strong>{euro(totalEspeces)}</strong>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.smallText}>Total encaissé</div>
          <strong>{euro(totalEncaisse)}</strong>
        </div>
      </div>

      <div style={styles.card}>
        <h3>{chequeEditId ? "Modifier chèque" : "Ajouter chèque"}</h3>

        <form onSubmit={addOrUpdateCheque} style={styles.formGrid5}>
          <input
            style={styles.input}
            type="date"
            value={formCheque.date}
            onChange={(e) => setFormCheque((prev) => ({ ...prev, date: e.target.value }))}
          />

          <input
            style={styles.input}
            placeholder="Nom / provenance"
            value={formCheque.nom}
            onChange={(e) => setFormCheque((prev) => ({ ...prev, nom: e.target.value }))}
          />

          <input
            style={styles.input}
            placeholder="Numéro facture"
            value={formCheque.numeroFacture}
            onChange={(e) =>
              setFormCheque((prev) => ({ ...prev, numeroFacture: e.target.value }))
            }
          />

          <input
            style={styles.input}
            type="number"
            step="0.01"
            placeholder="Montant chèque"
            value={formCheque.montant}
            onChange={(e) => setFormCheque((prev) => ({ ...prev, montant: e.target.value }))}
          />

          <input style={styles.input} type="file" onChange={handleChequeFile} />

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" style={styles.buttonGold}>
              {chequeEditId ? "Mettre à jour" : "Ajouter chèque"}
            </button>
            {chequeEditId && (
              <button type="button" style={styles.buttonDark} onClick={resetChequeForm}>
                Annuler
              </button>
            )}
          </div>
        </form>

        <p style={styles.smallText}>
          La photo du chèque mémorise le nom du fichier. Le vrai fichier n’est pas stocké dans localStorage.
        </p>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Nom / provenance</th>
                <th style={styles.th}>Facture</th>
                <th style={styles.th}>Montant</th>
                <th style={styles.th}>Photo chèque</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cheques.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan="6">Aucun chèque enregistré.</td>
                </tr>
              ) : (
                cheques.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.date}</td>
                    <td style={styles.td}>{item.nom || "-"}</td>
                    <td style={styles.td}>{item.numeroFacture}</td>
                    <td style={styles.td}>{euro(item.montant)}</td>
                    <td style={styles.td}>{item.photoCheque || "-"}</td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button type="button" style={styles.buttonDark} onClick={() => editCheque(item)}>
                          Modifier
                        </button>
                        <button type="button" style={styles.buttonRed} onClick={() => deleteCheque(item.id)}>
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

      <div style={styles.card}>
        <h3>{virementEditId ? "Modifier virement" : "Ajouter virement"}</h3>

        <form onSubmit={addOrUpdateVirement} style={styles.formGrid4}>
          <input
            style={styles.input}
            type="date"
            value={formVirement.date}
            onChange={(e) => setFormVirement((prev) => ({ ...prev, date: e.target.value }))}
          />

          <input
            style={styles.input}
            placeholder="Nom / provenance"
            value={formVirement.nom}
            onChange={(e) => setFormVirement((prev) => ({ ...prev, nom: e.target.value }))}
          />

          <input
            style={styles.input}
            placeholder="Numéro facture"
            value={formVirement.numeroFacture}
            onChange={(e) =>
              setFormVirement((prev) => ({ ...prev, numeroFacture: e.target.value }))
            }
          />

          <input
            style={styles.input}
            type="number"
            step="0.01"
            placeholder="Montant virement"
            value={formVirement.montant}
            onChange={(e) => setFormVirement((prev) => ({ ...prev, montant: e.target.value }))}
          />

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" style={styles.buttonGold}>
              {virementEditId ? "Mettre à jour" : "Ajouter virement"}
            </button>
            {virementEditId && (
              <button type="button" style={styles.buttonDark} onClick={resetVirementForm}>
                Annuler
              </button>
            )}
          </div>
        </form>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Nom / provenance</th>
                <th style={styles.th}>Facture</th>
                <th style={styles.th}>Montant</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {virements.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan="5">Aucun virement enregistré.</td>
                </tr>
              ) : (
                virements.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.date}</td>
                    <td style={styles.td}>{item.nom || "-"}</td>
                    <td style={styles.td}>{item.numeroFacture}</td>
                    <td style={styles.td}>{euro(item.montant)}</td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button type="button" style={styles.buttonDark} onClick={() => editVirement(item)}>
                          Modifier
                        </button>
                        <button type="button" style={styles.buttonRed} onClick={() => deleteVirement(item.id)}>
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

      <div style={styles.card}>
        <h3>{especeEditId ? "Modifier espèces" : "Ajouter espèces"}</h3>

        <form onSubmit={addOrUpdateEspece} style={styles.formGrid3}>
          <input
            style={styles.input}
            type="date"
            value={formEspece.date}
            onChange={(e) => setFormEspece((prev) => ({ ...prev, date: e.target.value }))}
          />

          <input
            style={styles.input}
            placeholder="Numéro facture"
            value={formEspece.numeroFacture}
            onChange={(e) =>
              setFormEspece((prev) => ({ ...prev, numeroFacture: e.target.value }))
            }
          />

          <input
            style={styles.input}
            type="number"
            step="0.01"
            placeholder="Montant espèces"
            value={formEspece.montant}
            onChange={(e) => setFormEspece((prev) => ({ ...prev, montant: e.target.value }))}
          />

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" style={styles.buttonGold}>
              {especeEditId ? "Mettre à jour" : "Ajouter espèces"}
            </button>
            {especeEditId && (
              <button type="button" style={styles.buttonDark} onClick={resetEspeceForm}>
                Annuler
              </button>
            )}
          </div>
        </form>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Facture</th>
                <th style={styles.th}>Montant</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {especes.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan="4">Aucune ligne espèces enregistrée.</td>
                </tr>
              ) : (
                especes.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.date}</td>
                    <td style={styles.td}>{item.numeroFacture}</td>
                    <td style={styles.td}>{euro(item.montant)}</td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button type="button" style={styles.buttonDark} onClick={() => editEspece(item)}>
                          Modifier
                        </button>
                        <button type="button" style={styles.buttonRed} onClick={() => deleteEspece(item.id)}>
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

      <div style={styles.card}>
        <h3>{depotEditId ? "Modifier dépôt espèces" : "Enregistrer un dépôt espèces"}</h3>

        <form onSubmit={saveDepot} style={styles.formGrid3}>
          <input
            style={styles.input}
            type="date"
            value={formDepot.dateDepot}
            onChange={(e) => setFormDepot((prev) => ({ ...prev, dateDepot: e.target.value }))}
          />

          <input
            style={styles.input}
            type="number"
            step="0.01"
            placeholder="Montant total du dépôt"
            value={formDepot.montantDepot}
            onChange={(e) =>
              setFormDepot((prev) => ({ ...prev, montantDepot: e.target.value }))
            }
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" style={styles.buttonGold}>
              {depotEditId ? "Mettre à jour dépôt" : "Enregistrer dépôt"}
            </button>
            {depotEditId && (
              <button type="button" style={styles.buttonDark} onClick={resetDepotForm}>
                Annuler
              </button>
            )}
          </div>
        </form>

        <p style={styles.smallText}>
          Tu peux d’abord enregistrer ton dépôt, puis ajouter les factures justificatives plus tard.
        </p>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date dépôt</th>
                <th style={styles.th}>Montant dépôt</th>
                <th style={styles.th}>Total factures</th>
                <th style={styles.th}>Reste</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {depots.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan="6">Aucun dépôt enregistré.</td>
                </tr>
              ) : (
                depots.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.dateDepot}</td>
                    <td style={styles.td}>{euro(item.montantDepot)}</td>
                    <td style={styles.td}>{euro(item.totalFactures)}</td>
                    <td style={styles.td}>{euro(item.reste)}</td>
                    <td style={styles.td}>
                      {item.statut === "Clôturé" ? (
                        <span style={styles.badgeGreen}>Clôturé</span>
                      ) : (
                        <span style={styles.badgeRed}>En cours</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button type="button" style={styles.buttonDark} onClick={() => openDepot(item)}>
                          Ouvrir
                        </button>

                        {item.statut === "En cours" ? (
                          <button type="button" style={styles.buttonGreen} onClick={() => cloturerDepot(item.id)}>
                            Clôturer
                          </button>
                        ) : (
                          <button type="button" style={styles.buttonDark} onClick={() => reouvrirDepot(item.id)}>
                            Réouvrir
                          </button>
                        )}

                        <button type="button" style={styles.buttonRed} onClick={() => deleteDepot(item.id)}>
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

      {depotActif && (
        <div style={styles.card}>
          <h3>Factures justificatives du dépôt</h3>
          <p style={styles.smallText}>
            Dépôt du {depotActif.dateDepot} — Montant dépôt : {euro(depotActif.montantDepot)}
          </p>

          <div style={styles.lineBox}>
            <div style={styles.formGrid3}>
              <input
                style={styles.input}
                placeholder="Numéro facture"
                value={formDepotLine.numeroFacture}
                onChange={(e) =>
                  setFormDepotLine((prev) => ({
                    ...prev,
                    numeroFacture: e.target.value,
                  }))
                }
              />

              <input
                style={styles.input}
                type="number"
                step="0.01"
                placeholder="Montant facture"
                value={formDepotLine.montant}
                onChange={(e) =>
                  setFormDepotLine((prev) => ({
                    ...prev,
                    montant: e.target.value,
                  }))
                }
              />

              <button type="button" style={styles.buttonGold} onClick={addLineToDepot}>
                Ajouter facture
              </button>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Numéro facture</th>
                    <th style={styles.th}>Montant facture</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(depotActif.lignes || []).length === 0 ? (
                    <tr>
                      <td style={styles.td} colSpan="3">Aucune facture liée à ce dépôt.</td>
                    </tr>
                  ) : (
                    depotActif.lignes.map((line) => (
                      <tr key={line.id}>
                        <td style={styles.td}>{line.numeroFacture}</td>
                        <td style={styles.td}>{euro(line.montant)}</td>
                        <td style={styles.td}>
                          <button
                            type="button"
                            style={styles.buttonRed}
                            onClick={() => removeLineFromDepot(line.id)}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={styles.grid4}>
              <div style={styles.summaryCard}>
                <div style={styles.smallText}>Montant dépôt</div>
                <strong>{euro(depotActif.montantDepot)}</strong>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.smallText}>Total factures liées</div>
                <strong>{euro(depotActif.totalFactures)}</strong>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.smallText}>Reste à justifier</div>
                <strong>{euro(depotActif.reste)}</strong>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.smallText}>Statut dépôt</div>
                {depotActif.statut === "Clôturé" ? (
                  <span style={styles.badgeGreen}>Clôturé</span>
                ) : (
                  <span style={styles.badgeRed}>En cours</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.grid4}>
        <div style={styles.summaryCard}>
          <div style={styles.smallText}>Total dépôts banque</div>
          <strong>{euro(totalDepots)}</strong>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.smallText}>Écart espèces / dépôts</div>
          <strong>{euro(totalEspeces - totalDepots)}</strong>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.smallText}>Nombre de dépôts</div>
          <strong>{depots.length}</strong>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.smallText}>Nombre de lignes espèces</div>
          <strong>{especes.length}</strong>
        </div>
      </div>
    </div>
  );
}

export default Finances;