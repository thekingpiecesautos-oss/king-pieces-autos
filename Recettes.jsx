import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchStore, saveStore } from "./api";

function Recettes() {
  const today = () => new Date().toISOString().split("T")[0];
  const makeId = () => Date.now() + Math.random();
  const euro = (value) => `${Number(value || 0).toFixed(2)} €`;

  const defaultData = { cartesBleues: [], especes: [] };
  const loaded = useRef(false);

  const normalizeFactureCB = (line) => ({
    id: line.id || makeId(),
    numeroFacture: line.numeroFacture || "",
    nomClient: line.nomClient || "",
    montant: Number(line.montant || 0),
  });

  const normalizeCarteBleue = (item) => {
    const factures = Array.isArray(item.factures)
      ? item.factures.map(normalizeFactureCB)
      : [];

    const totalFactures = factures.reduce(
      (acc, line) => acc + Number(line.montant || 0),
      0
    );

    const montantTotal = Number(item.montantTotal || 0);

    return {
      id: item.id || makeId(),
      date: item.date || today(),
      montantTotal,
      factures,
      totalFactures: Number(totalFactures.toFixed(2)),
      difference: Number((montantTotal - totalFactures).toFixed(2)),
    };
  };

  const normalizeEspece = (item) => ({
    id: item.id || makeId(),
    date: item.date || today(),
    montantTotal: Number(item.montantTotal || 0),
    personne: item.personne || "",
  });

  const [cartesBleues, setCartesBleues] = useState([]);
  const [especes, setEspeces] = useState([]);

  const [cbEditId, setCbEditId] = useState(null);
  const [especeEditId, setEspeceEditId] = useState(null);
  const [cbActiveId, setCbActiveId] = useState(null);

  const [formCB, setFormCB] = useState({
    date: today(),
    montantTotal: "",
  });

  const [formFactureCB, setFormFactureCB] = useState({
    numeroFacture: "",
    nomClient: "",
    montant: "",
  });

  const [formEspece, setFormEspece] = useState({
    date: today(),
    montantTotal: "",
    personne: "",
  });

  useEffect(() => {
    fetchStore("recettes_data", defaultData).then((data) => {
      const source = data || defaultData;
      setCartesBleues(Array.isArray(source.cartesBleues) ? source.cartesBleues.map(normalizeCarteBleue) : []);
      setEspeces(Array.isArray(source.especes) ? source.especes.map(normalizeEspece) : []);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    saveStore("recettes_data", { cartesBleues, especes }).catch(console.error);
  }, [cartesBleues, especes]);

  const cbActive =
    cartesBleues.find((item) => item.id === cbActiveId) || null;

  const totalCarteBleue = useMemo(
    () =>
      cartesBleues.reduce(
        (acc, item) => acc + Number(item.montantTotal || 0),
        0
      ),
    [cartesBleues]
  );

  const totalEspeces = useMemo(
    () =>
      especes.reduce(
        (acc, item) => acc + Number(item.montantTotal || 0),
        0
      ),
    [especes]
  );

  const totalRecettes = totalCarteBleue + totalEspeces;

  const styles = {
    page: {
      width: "100%",
    },
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
    grid3: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 12,
      marginBottom: 20,
    },
    formGrid3: {
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

  const resetFormCB = () => {
    setFormCB({
      date: today(),
      montantTotal: "",
    });
    setCbEditId(null);
  };

  const resetFormFactureCB = () => {
    setFormFactureCB({
      numeroFacture: "",
      nomClient: "",
      montant: "",
    });
  };

  const resetFormEspece = () => {
    setFormEspece({
      date: today(),
      montantTotal: "",
      personne: "",
    });
    setEspeceEditId(null);
  };

  const saveCarteBleue = (e) => {
    e.preventDefault();

    const montantTotal = Number(formCB.montantTotal || 0);

    if (montantTotal <= 0) {
      alert("Entre le montant total carte bleue.");
      return;
    }

    const currentFactures =
      cbEditId && cbActive && cbActive.id === cbEditId ? cbActive.factures || [] : [];

    const item = normalizeCarteBleue({
      id: cbEditId || makeId(),
      date: formCB.date,
      montantTotal,
      factures: currentFactures,
    });

    if (cbEditId) {
      setCartesBleues((prev) => prev.map((cb) => (cb.id === cbEditId ? item : cb)));
      setCbActiveId(item.id);
    } else {
      setCartesBleues((prev) => [item, ...prev]);
      setCbActiveId(item.id);
    }

    resetFormCB();
  };

  const openCarteBleue = (item) => {
    setCbActiveId(item.id);
    setCbEditId(item.id);
    setFormCB({
      date: item.date,
      montantTotal: item.montantTotal,
    });
    resetFormFactureCB();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addFactureToCB = () => {
    if (!cbActive) {
      alert("Enregistre ou ouvre d'abord un total carte bleue.");
      return;
    }

    if (!formFactureCB.numeroFacture.trim()) {
      alert("Entre le numéro de facture.");
      return;
    }

    if (!formFactureCB.nomClient.trim()) {
      alert("Entre le nom du client.");
      return;
    }

    if (Number(formFactureCB.montant || 0) <= 0) {
      alert("Entre le montant de la facture.");
      return;
    }

    const nouvelleFacture = normalizeFactureCB({
      id: makeId(),
      numeroFacture: formFactureCB.numeroFacture,
      nomClient: formFactureCB.nomClient,
      montant: formFactureCB.montant,
    });

    setCartesBleues((prev) =>
      prev.map((cb) => {
        if (cb.id !== cbActive.id) return cb;

        const factures = [...(cb.factures || []), nouvelleFacture];
        return normalizeCarteBleue({
          ...cb,
          factures,
        });
      })
    );

    resetFormFactureCB();
  };

  const removeFactureFromCB = (lineId) => {
    if (!cbActive) return;

    setCartesBleues((prev) =>
      prev.map((cb) => {
        if (cb.id !== cbActive.id) return cb;

        const factures = (cb.factures || []).filter((line) => line.id !== lineId);
        return normalizeCarteBleue({
          ...cb,
          factures,
        });
      })
    );
  };

  const deleteCarteBleue = (id) => {
    const ok = window.confirm("Voulez-vous supprimer ce total carte bleue ?");
    if (!ok) return;

    setCartesBleues((prev) => prev.filter((item) => item.id !== id));

    if (cbActiveId === id) {
      setCbActiveId(null);
      resetFormCB();
      resetFormFactureCB();
    }
  };

  const saveEspece = (e) => {
    e.preventDefault();

    const montantTotal = Number(formEspece.montantTotal || 0);

    if (montantTotal <= 0) {
      alert("Entre le montant total espèces.");
      return;
    }

    if (!formEspece.personne.trim()) {
      alert("Entre le nom de la personne.");
      return;
    }

    const item = normalizeEspece({
      id: especeEditId || makeId(),
      ...formEspece,
    });

    if (especeEditId) {
      setEspeces((prev) => prev.map((esp) => (esp.id === especeEditId ? item : esp)));
    } else {
      setEspeces((prev) => [item, ...prev]);
    }

    resetFormEspece();
  };

  const editEspece = (item) => {
    setFormEspece({
      date: item.date,
      montantTotal: item.montantTotal,
      personne: item.personne,
    });
    setEspeceEditId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteEspece = (id) => {
    const ok = window.confirm("Voulez-vous supprimer cette ligne espèces ?");
    if (!ok) return;

    setEspeces((prev) => prev.filter((item) => item.id !== id));

    if (especeEditId === id) {
      resetFormEspece();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p className="breadcrumb">Accueil / Recettes</p>
        <h1 style={styles.title}>Recettes</h1>
        <p style={styles.subtitle}>
          Carte bleue et espèces uniquement.
        </p>
      </div>

      <div style={styles.grid3}>
        <div style={styles.summaryCard}>
          <div style={styles.smallText}>Total carte bleue</div>
          <strong>{euro(totalCarteBleue)}</strong>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.smallText}>Total espèces</div>
          <strong>{euro(totalEspeces)}</strong>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.smallText}>Total recettes</div>
          <strong>{euro(totalRecettes)}</strong>
        </div>
      </div>

      <div style={styles.card}>
        <h3>{cbEditId ? "Modifier total carte bleue" : "Enregistrer total carte bleue"}</h3>

        <form onSubmit={saveCarteBleue} style={styles.formGrid3}>
          <input
            style={styles.input}
            type="date"
            value={formCB.date}
            onChange={(e) => setFormCB((prev) => ({ ...prev, date: e.target.value }))}
          />

          <input
            style={styles.input}
            type="number"
            step="0.01"
            placeholder="Montant total carte bleue"
            value={formCB.montantTotal}
            onChange={(e) =>
              setFormCB((prev) => ({ ...prev, montantTotal: e.target.value }))
            }
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" style={styles.buttonGold}>
              {cbEditId ? "Mettre à jour total CB" : "Enregistrer total CB"}
            </button>

            {cbEditId && (
              <button type="button" style={styles.buttonDark} onClick={resetFormCB}>
                Annuler
              </button>
            )}
          </div>
        </form>

        <p style={styles.smallText}>
          Tu peux enregistrer d’abord le total carte bleue, puis ajouter les factures en dessous plus tard.
        </p>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Montant total CB</th>
                <th style={styles.th}>Total factures</th>
                <th style={styles.th}>Différence</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cartesBleues.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan="5">Aucun total carte bleue enregistré.</td>
                </tr>
              ) : (
                cartesBleues.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.date}</td>
                    <td style={styles.td}>{euro(item.montantTotal)}</td>
                    <td style={styles.td}>{euro(item.totalFactures)}</td>
                    <td style={styles.td}>
                      {Number(item.difference.toFixed(2)) === 0 ? (
                        <span style={styles.badgeGreen}>{euro(item.difference)}</span>
                      ) : (
                        <span style={styles.badgeRed}>{euro(item.difference)}</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button type="button" style={styles.buttonDark} onClick={() => openCarteBleue(item)}>
                          Ouvrir
                        </button>
                        <button type="button" style={styles.buttonRed} onClick={() => deleteCarteBleue(item.id)}>
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

      {cbActive && (
        <div style={styles.card}>
          <h3>Factures liées au total carte bleue</h3>
          <p style={styles.smallText}>
            Total CB du {cbActive.date} — Montant total : {euro(cbActive.montantTotal)}
          </p>

          <div style={styles.lineBox}>
            <div style={styles.formGrid3}>
              <input
                style={styles.input}
                placeholder="Numéro facture"
                value={formFactureCB.numeroFacture}
                onChange={(e) =>
                  setFormFactureCB((prev) => ({
                    ...prev,
                    numeroFacture: e.target.value,
                  }))
                }
              />

              <input
                style={styles.input}
                placeholder="Nom client"
                value={formFactureCB.nomClient}
                onChange={(e) =>
                  setFormFactureCB((prev) => ({
                    ...prev,
                    nomClient: e.target.value,
                  }))
                }
              />

              <input
                style={styles.input}
                type="number"
                step="0.01"
                placeholder="Montant facture"
                value={formFactureCB.montant}
                onChange={(e) =>
                  setFormFactureCB((prev) => ({
                    ...prev,
                    montant: e.target.value,
                  }))
                }
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <button type="button" style={styles.buttonGold} onClick={addFactureToCB}>
                Ajouter facture
              </button>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Numéro facture</th>
                    <th style={styles.th}>Nom client</th>
                    <th style={styles.th}>Montant</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(cbActive.factures || []).length === 0 ? (
                    <tr>
                      <td style={styles.td} colSpan="4">Aucune facture liée à ce total carte bleue.</td>
                    </tr>
                  ) : (
                    cbActive.factures.map((line) => (
                      <tr key={line.id}>
                        <td style={styles.td}>{line.numeroFacture}</td>
                        <td style={styles.td}>{line.nomClient}</td>
                        <td style={styles.td}>{euro(line.montant)}</td>
                        <td style={styles.td}>
                          <button
                            type="button"
                            style={styles.buttonRed}
                            onClick={() => removeFactureFromCB(line.id)}
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

            <div style={styles.grid3}>
              <div style={styles.summaryCard}>
                <div style={styles.smallText}>Montant total CB</div>
                <strong>{euro(cbActive.montantTotal)}</strong>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.smallText}>Total des factures</div>
                <strong>{euro(cbActive.totalFactures)}</strong>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.smallText}>Différence</div>
                {Number(cbActive.difference.toFixed(2)) === 0 ? (
                  <span style={styles.badgeGreen}>{euro(cbActive.difference)}</span>
                ) : (
                  <span style={styles.badgeRed}>{euro(cbActive.difference)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h3>{especeEditId ? "Modifier espèces" : "Enregistrer espèces"}</h3>

        <form onSubmit={saveEspece} style={styles.formGrid3}>
          <input
            style={styles.input}
            type="date"
            value={formEspece.date}
            onChange={(e) => setFormEspece((prev) => ({ ...prev, date: e.target.value }))}
          />

          <input
            style={styles.input}
            type="number"
            step="0.01"
            placeholder="Montant total espèces"
            value={formEspece.montantTotal}
            onChange={(e) =>
              setFormEspece((prev) => ({ ...prev, montantTotal: e.target.value }))
            }
          />

          <input
            style={styles.input}
            placeholder="Personne qui a pris les espèces"
            value={formEspece.personne}
            onChange={(e) =>
              setFormEspece((prev) => ({ ...prev, personne: e.target.value }))
            }
          />

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" style={styles.buttonGold}>
              {especeEditId ? "Mettre à jour espèces" : "Enregistrer espèces"}
            </button>

            {especeEditId && (
              <button type="button" style={styles.buttonDark} onClick={resetFormEspece}>
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
                <th style={styles.th}>Montant espèces</th>
                <th style={styles.th}>Personne</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {especes.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan="4">Aucune recette espèces enregistrée.</td>
                </tr>
              ) : (
                especes.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.date}</td>
                    <td style={styles.td}>{euro(item.montantTotal)}</td>
                    <td style={styles.td}>{item.personne}</td>
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
    </div>
  );
}

export default Recettes;