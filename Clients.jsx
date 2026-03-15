import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchStore, saveStore } from "./api";
import "./Clients.css";

function Clients() {
  const today = () => new Date().toISOString().split("T")[0];


  const normalizeAchat = (achat) => {
    const prix = Number(achat.prix || 0);
    const quantite = Number(achat.quantite || 0);
    const total = Number(achat.total || prix * quantite);

    return {
      id: achat.id || Date.now() + Math.random(),
      date: achat.date || today(),
      designation: achat.designation || "",
      prix,
      quantite,
      total,
    };
  };

  const normalizeClient = (client) => ({
    id: client.id || Date.now() + Math.random(),
    nom: client.nom || "",
    telephone: client.telephone || "",
    adresse: client.adresse || "",
    achats: Array.isArray(client.achats) ? client.achats.map(normalizeAchat) : [],
    paiements: Array.isArray(client.paiements) ? client.paiements : [],
  });

  const [clients, setClients] = useState([]);
  const loaded = useRef(false);

  const [recherche, setRecherche] = useState("");
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [clientEnCoursId, setClientEnCoursId] = useState(null);
  const [clientSelectionneId, setClientSelectionneId] = useState(null);

  const [formulaireClient, setFormulaireClient] = useState({
    nom: "",
    telephone: "",
    adresse: "",
  });

  const [formulaireAchat, setFormulaireAchat] = useState({
    date: today(),
    designation: "",
    prix: "",
    quantite: 1,
  });

  const [modePaiement, setModePaiement] = useState("Espèces");
  const [montantPaiement, setMontantPaiement] = useState("");
  const [selectedAchatIds, setSelectedAchatIds] = useState([]);

  useEffect(() => {
    fetchStore("clients", []).then((data) => {
      setClients(Array.isArray(data) ? data : []);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    saveStore("clients", clients).catch(console.error);
  }, [clients]);

  const resetFormulaireClient = () => {
    setFormulaireClient({
      nom: "",
      telephone: "",
      adresse: "",
    });
    setModeEdition(false);
    setClientEnCoursId(null);
  };

  const resetFormulaireAchat = () => {
    setFormulaireAchat({
      date: today(),
      designation: "",
      prix: "",
      quantite: 1,
    });
  };

  const handleChangeClient = (e) => {
    const { name, value } = e.target;
    setFormulaireClient((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangeAchat = (e) => {
    const { name, value } = e.target;
    setFormulaireAchat((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const enregistrerClient = (e) => {
    e.preventDefault();

    if (!formulaireClient.nom.trim()) {
      alert("Entre le nom du client ou de l’entreprise.");
      return;
    }

    if (modeEdition && clientEnCoursId) {
      setClients((prev) =>
        prev.map((client) =>
          client.id === clientEnCoursId
            ? { ...client, ...formulaireClient }
            : client
        )
      );
    } else {
      const nouveauClient = normalizeClient({
        id: Date.now(),
        nom: formulaireClient.nom,
        telephone: formulaireClient.telephone,
        adresse: formulaireClient.adresse,
        achats: [],
        paiements: [],
      });

      setClients((prev) => [...prev, nouveauClient]);
      setClientSelectionneId(nouveauClient.id);
    }

    setAfficherFormulaire(false);
    resetFormulaireClient();
  };

  const modifierClient = (client) => {
    setFormulaireClient({
      nom: client.nom || "",
      telephone: client.telephone || "",
      adresse: client.adresse || "",
    });
    setModeEdition(true);
    setClientEnCoursId(client.id);
    setClientSelectionneId(client.id);
    setAfficherFormulaire(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const supprimerClient = (id) => {
    const ok = window.confirm("Voulez-vous supprimer ce client ?");
    if (!ok) return;

    setClients((prev) => prev.filter((client) => client.id !== id));
    if (clientSelectionneId === id) setClientSelectionneId(null);
    if (clientEnCoursId === id) {
      resetFormulaireClient();
      setAfficherFormulaire(false);
    }
    setSelectedAchatIds([]);
  };

  const clientsFiltres = useMemo(() => {
    return clients.filter((client) => {
      const texte =
        `${client.nom} ${client.telephone} ${client.adresse}`.toLowerCase();
      return texte.includes(recherche.toLowerCase());
    });
  }, [clients, recherche]);

  const clientSelectionne =
    clients.find((client) => client.id === clientSelectionneId) ||
    clientsFiltres[0] ||
    null;

  useEffect(() => {
    setSelectedAchatIds([]);
  }, [clientSelectionneId]);

  const getPaidAmount = (client, achat) => {
    if (!client) return 0;

    let total = 0;

    (client.paiements || []).forEach((paiement) => {
      (paiement.pieces || []).forEach((piece) => {
        if (piece.achatId === achat.id) {
          total += Number(piece.montantRegle || 0);
        }
      });
    });

    return Number(total.toFixed(2));
  };

  const getReste = (client, achat) => {
    const reste = Number(achat.total || 0) - getPaidAmount(client, achat);
    return Number(Math.max(0, reste).toFixed(2));
  };

  const getStatut = (client, achat) => {
    const total = Number(achat.total || 0);
    const paye = getPaidAmount(client, achat);
    const reste = getReste(client, achat);

    if (total > 0 && reste === 0) return "Payé";
    if (paye > 0) return "Partiellement payé";
    return "Non payé";
  };

  const getBadgeClass = (statut) => {
    if (statut === "Payé") return "badge-paye";
    if (statut === "Partiellement payé") return "badge-partiel";
    return "badge-impaye";
  };

  const ajouterAchat = () => {
    if (!clientSelectionne) {
      alert("Sélectionne d'abord un client.");
      return;
    }

    if (!formulaireAchat.designation.trim()) {
      alert("Entre la désignation de la pièce.");
      return;
    }

    const prix = Number(formulaireAchat.prix || 0);
    const quantite = Number(formulaireAchat.quantite || 0);

    if (quantite <= 0) {
      alert("La quantité doit être supérieure à 0.");
      return;
    }

    const achat = normalizeAchat({
      id: Date.now(),
      date: formulaireAchat.date || today(),
      designation: formulaireAchat.designation,
      prix,
      quantite,
      total: prix * quantite,
    });

    setClients((prev) =>
      prev.map((client) =>
        client.id === clientSelectionne.id
          ? { ...client, achats: [...client.achats, achat] }
          : client
      )
    );

    resetFormulaireAchat();
  };

  const supprimerAchat = (achatId) => {
    if (!clientSelectionne) return;

    setClients((prev) =>
      prev.map((client) =>
        client.id === clientSelectionne.id
          ? {
              ...client,
              achats: client.achats.filter((achat) => achat.id !== achatId),
              paiements: client.paiements.map((paiement) => ({
                ...paiement,
                pieces: (paiement.pieces || []).filter(
                  (piece) => piece.achatId !== achatId
                ),
              })),
            }
          : client
      )
    );

    setSelectedAchatIds((prev) => prev.filter((id) => id !== achatId));
  };

  const toggleSelection = (achatId) => {
    setSelectedAchatIds((prev) =>
      prev.includes(achatId)
        ? prev.filter((id) => id !== achatId)
        : [...prev, achatId]
    );
  };

  const validerPaiementSelection = () => {
    if (!clientSelectionne) return;

    const achatsSelectionnes = clientSelectionne.achats.filter(
      (achat) =>
        selectedAchatIds.includes(achat.id) && getReste(clientSelectionne, achat) > 0
    );

    if (achatsSelectionnes.length === 0) {
      alert("Sélectionne au moins une pièce.");
      return;
    }

    const montant = Number(montantPaiement || 0);

    if (montant <= 0) {
      alert("Entre un montant supérieur à 0.");
      return;
    }

    const totalSelection = achatsSelectionnes.reduce(
      (acc, achat) => acc + getReste(clientSelectionne, achat),
      0
    );

    if (montant > totalSelection) {
      alert(
        `Le montant dépasse le total sélectionné (${totalSelection.toFixed(2)} €).`
      );
      return;
    }

    let resteARepartir = montant;
    const detailsPaiement = [];

    achatsSelectionnes.forEach((achat) => {
      if (resteARepartir <= 0) return;

      const resteAvant = getReste(clientSelectionne, achat);
      const montantAffecte = Math.min(resteAvant, resteARepartir);
      const resteApres = Number((resteAvant - montantAffecte).toFixed(2));

      detailsPaiement.push({
        achatId: achat.id,
        designation: achat.designation,
        montantRegle: Number(montantAffecte.toFixed(2)),
        resteApres,
      });

      resteARepartir -= montantAffecte;
    });

    const nouveauPaiement = {
      id: Date.now() + Math.random(),
      date: today(),
      modePaiement,
      montant: Number(montant.toFixed(2)),
      pieces: detailsPaiement,
    };

    setClients((prev) =>
      prev.map((client) =>
        client.id === clientSelectionne.id
          ? { ...client, paiements: [...client.paiements, nouveauPaiement] }
          : client
      )
    );

    setSelectedAchatIds([]);
    setMontantPaiement("");
    setModePaiement("Espèces");
  };

  const annulerPaiement = (paiementId) => {
    if (!clientSelectionne) return;

    const ok = window.confirm("Voulez-vous annuler ce paiement ?");
    if (!ok) return;

    setClients((prev) =>
      prev.map((client) =>
        client.id === clientSelectionne.id
          ? {
              ...client,
              paiements: client.paiements.filter((p) => p.id !== paiementId),
            }
          : client
      )
    );
  };

  const imprimerPaiement = (paiement) => {
    if (!clientSelectionne) return;

    const lignesHtml = (paiement.pieces || [])
      .map(
        (piece) => `
          <tr>
            <td>${piece.designation}</td>
            <td>${Number(piece.montantRegle || 0).toFixed(2)} €</td>
            <td>${Number(piece.resteApres || 0).toFixed(2)} €</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Reçu paiement client</title>
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              padding: 30px;
              color: #111827;
            }
            .header {
              border-bottom: 3px solid #d4af37;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 6px 0;
              color: #555;
            }
            .box {
              border: 1px solid #ddd;
              border-radius: 10px;
              padding: 14px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border-bottom: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background: #f8fafc;
            }
            .total {
              margin-top: 20px;
              width: 320px;
              margin-left: auto;
              border: 1px solid #ddd;
              border-radius: 10px;
              padding: 14px;
            }
            .montant {
              display: flex;
              justify-content: space-between;
              font-size: 22px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>THE KING PIECES AUTOS</h1>
            <p>Reçu de paiement client</p>
          </div>

          <div class="box">
            <p><strong>Client :</strong> ${clientSelectionne.nom}</p>
            <p><strong>Téléphone :</strong> ${clientSelectionne.telephone || "-"}</p>
            <p><strong>Adresse :</strong> ${clientSelectionne.adresse || "-"}</p>
            <p><strong>Date :</strong> ${paiement.date}</p>
            <p><strong>Mode de paiement :</strong> ${paiement.modePaiement}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Pièce réglée</th>
                <th>Montant payé</th>
                <th>Reste après paiement</th>
              </tr>
            </thead>
            <tbody>
              ${lignesHtml}
            </tbody>
          </table>

          <div class="total">
            <div class="montant">
              <span>Montant payé</span>
              <strong>${Number(paiement.montant || 0).toFixed(2)} €</strong>
            </div>
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const achatsClient = clientSelectionne?.achats || [];

  const achatsEnCours = achatsClient.filter(
    (achat) => getReste(clientSelectionne, achat) > 0
  );

  const achatsSoldes = achatsClient.filter(
    (achat) => getReste(clientSelectionne, achat) === 0
  );

  const totalAchats = achatsClient.reduce(
    (acc, achat) => acc + Number(achat.total || 0),
    0
  );

  const totalPaye = (clientSelectionne?.paiements || []).reduce(
    (acc, paiement) => acc + Number(paiement.montant || 0),
    0
  );

  const resteAPayer = Number((totalAchats - totalPaye).toFixed(2));

  const totalSelection = achatsEnCours
    .filter((achat) => selectedAchatIds.includes(achat.id))
    .reduce((acc, achat) => acc + getReste(clientSelectionne, achat), 0);

  return (
    <div className="clients-page">
      <header className="clients-header">
        <div>
          <p className="breadcrumb">Accueil / Clients</p>
          <h1 className="clients-title">Gestion des clients</h1>
          <p className="clients-subtitle">
            Ajoute tes clients et garde l’historique complet de leurs achats et paiements.
          </p>
        </div>

        <div className="clients-header-actions">
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="clients-search"
          />

          <button
            className="clients-add-btn"
            onClick={() => {
              setAfficherFormulaire(!afficherFormulaire);
              if (afficherFormulaire) resetFormulaireClient();
            }}
          >
            + Ajouter client
          </button>
        </div>
      </header>

      {afficherFormulaire && (
        <section className="clients-form-panel">
          <h3>{modeEdition ? "Modifier le client" : "Nouveau client"}</h3>

          <form onSubmit={enregistrerClient} className="clients-form-grid">
            <input
              name="nom"
              placeholder="Nom du client ou nom de l’entreprise"
              value={formulaireClient.nom}
              onChange={handleChangeClient}
              required
            />

            <input
              name="telephone"
              placeholder="Téléphone"
              value={formulaireClient.telephone}
              onChange={handleChangeClient}
            />

            <input
              name="adresse"
              placeholder="Adresse"
              value={formulaireClient.adresse}
              onChange={handleChangeClient}
            />

            <div className="clients-form-actions">
              <button type="submit" className="clients-save-btn">
                {modeEdition ? "Mettre à jour" : "Enregistrer"}
              </button>

              {modeEdition && (
                <button
                  type="button"
                  className="clients-cancel-btn"
                  onClick={() => {
                    resetFormulaireClient();
                    setAfficherFormulaire(false);
                  }}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <div className="clients-layout">
        <aside className="clients-sidebar">
          <h3>Liste des clients</h3>

          {clientsFiltres.length === 0 ? (
            <p className="clients-empty">Aucun client enregistré.</p>
          ) : (
            <div className="clients-list">
              {clientsFiltres.map((client) => (
                <div
                  key={client.id}
                  className={
                    clientSelectionne && clientSelectionne.id === client.id
                      ? "client-card active"
                      : "client-card"
                  }
                  onClick={() => setClientSelectionneId(client.id)}
                >
                  <div className="client-card-top">
                    <strong>{client.nom}</strong>
                  </div>

                  <div className="client-card-info">{client.telephone || "-"}</div>
                  <div className="client-card-info">{client.adresse || "-"}</div>

                  <div className="client-card-actions">
                    <button
                      className="client-btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        modifierClient(client);
                      }}
                    >
                      Modifier
                    </button>

                    <button
                      className="client-btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        supprimerClient(client.id);
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        <section className="client-detail-panel">
          {!clientSelectionne ? (
            <p className="clients-empty">Sélectionne un client pour voir sa fiche.</p>
          ) : (
            <>
              <div className="client-detail-header">
                <h2>{clientSelectionne.nom}</h2>
                <p>Téléphone : {clientSelectionne.telephone || "-"}</p>
                <p>Adresse : {clientSelectionne.adresse || "-"}</p>
              </div>

              <div className="client-summary-grid">
                <div className="client-summary-card">
                  <span>Total achats</span>
                  <strong>{totalAchats.toFixed(2)} €</strong>
                </div>

                <div className="client-summary-card">
                  <span>Total payé</span>
                  <strong>{totalPaye.toFixed(2)} €</strong>
                </div>

                <div className="client-summary-card">
                  <span>Reste à payer</span>
                  <strong>{resteAPayer.toFixed(2)} €</strong>
                </div>
              </div>

              <div className="client-achats-panel">
                <h3>Ajouter une pièce achetée</h3>

                <div className="client-achats-form">
                  <input
                    type="date"
                    name="date"
                    value={formulaireAchat.date}
                    onChange={handleChangeAchat}
                  />

                  <input
                    type="text"
                    name="designation"
                    placeholder="Désignation pièce"
                    value={formulaireAchat.designation}
                    onChange={handleChangeAchat}
                  />

                  <input
                    type="number"
                    name="prix"
                    placeholder="Prix"
                    value={formulaireAchat.prix}
                    onChange={handleChangeAchat}
                  />

                  <input
                    type="number"
                    name="quantite"
                    placeholder="Quantité"
                    value={formulaireAchat.quantite}
                    onChange={handleChangeAchat}
                  />

                  <button className="clients-add-piece-btn" onClick={ajouterAchat}>
                    Ajouter pièce
                  </button>
                </div>
              </div>

              <div className="client-history-panel">
                <h3>Liste des achats en cours</h3>

                {achatsEnCours.length === 0 ? (
                  <p className="clients-empty">Aucune pièce en attente de paiement.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="stock-table">
                      <thead>
                        <tr>
                          <th>Sélection</th>
                          <th>Date</th>
                          <th>Pièce</th>
                          <th>Prix</th>
                          <th>Quantité</th>
                          <th>Total</th>
                          <th>Payé</th>
                          <th>Reste</th>
                          <th>Statut</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {achatsEnCours.map((achat) => {
                          const statut = getStatut(clientSelectionne, achat);
                          const paye = getPaidAmount(clientSelectionne, achat);
                          const reste = getReste(clientSelectionne, achat);

                          return (
                            <tr key={achat.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedAchatIds.includes(achat.id)}
                                  onChange={() => toggleSelection(achat.id)}
                                />
                              </td>
                              <td>{achat.date}</td>
                              <td>{achat.designation}</td>
                              <td>{Number(achat.prix).toFixed(2)} €</td>
                              <td>{achat.quantite}</td>
                              <td>{Number(achat.total).toFixed(2)} €</td>
                              <td>{paye.toFixed(2)} €</td>
                              <td>{reste.toFixed(2)} €</td>
                              <td>
                                <span className={`payment-badge ${getBadgeClass(statut)}`}>
                                  {statut}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="client-btn-delete"
                                  onClick={() => supprimerAchat(achat.id)}
                                >
                                  Supprimer
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="paiement-box">
                  <div className="paiement-box-row">
                    <span>Total sélectionné à régler</span>
                    <strong>{totalSelection.toFixed(2)} €</strong>
                  </div>

                  <div className="paiement-box-row">
                    <span>Montant encaissé</span>
                    <input
                      type="number"
                      value={montantPaiement}
                      onChange={(e) => setMontantPaiement(e.target.value)}
                      className="paiement-input"
                      placeholder="Ex : 80"
                    />
                  </div>

                  <div className="paiement-box-row">
                    <span>Mode de paiement</span>
                    <select
                      value={modePaiement}
                      onChange={(e) => setModePaiement(e.target.value)}
                      className="paiement-select"
                    >
                      <option value="Espèces">Espèces</option>
                      <option value="Carte bleue">Carte bleue</option>
                      <option value="Virement">Virement</option>
                      <option value="Chèque">Chèque</option>
                    </select>
                  </div>

                  <button
                    className="clients-pay-btn"
                    onClick={validerPaiementSelection}
                  >
                    Valider le paiement
                  </button>
                </div>
              </div>

              <div className="client-history-panel">
                <h3>Pièces soldées</h3>

                {achatsSoldes.length === 0 ? (
                  <p className="clients-empty">Aucune pièce totalement payée.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="stock-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Pièce</th>
                          <th>Total</th>
                          <th>Payé</th>
                          <th>Statut</th>
                        </tr>
                      </thead>

                      <tbody>
                        {achatsSoldes.map((achat) => (
                          <tr key={achat.id}>
                            <td>{achat.date}</td>
                            <td>{achat.designation}</td>
                            <td>{Number(achat.total).toFixed(2)} €</td>
                            <td>{Number(achat.total).toFixed(2)} €</td>
                            <td>
                              <span className="payment-badge badge-paye">Payé</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="client-history-panel">
                <h3>Historique des paiements</h3>

                {(clientSelectionne.paiements || []).length === 0 ? (
                  <p className="clients-empty">Aucun paiement enregistré.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="stock-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Mode</th>
                          <th>Montant payé</th>
                          <th>Pièces réglées</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {clientSelectionne.paiements.map((paiement) => (
                          <tr key={paiement.id}>
                            <td>{paiement.date}</td>
                            <td>{paiement.modePaiement}</td>
                            <td>{Number(paiement.montant).toFixed(2)} €</td>
                            <td>
                              {paiement.pieces
                                .map(
                                  (piece) =>
                                    `${piece.designation} (${Number(
                                      piece.montantRegle || 0
                                    ).toFixed(2)} €)`
                                )
                                .join(", ")}
                            </td>
                            <td>
                              <div className="client-card-actions">
                                <button
                                  className="client-btn-edit"
                                  onClick={() => imprimerPaiement(paiement)}
                                >
                                  Imprimer
                                </button>
                                <button
                                  className="client-btn-delete"
                                  onClick={() => annulerPaiement(paiement.id)}
                                >
                                  Annuler paiement
                                </button>
                              </div>
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

export default Clients;