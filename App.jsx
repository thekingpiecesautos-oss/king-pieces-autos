import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";
import logo from "./logo.png";
import imageKing from "./king-pieces.jpeg";
import Devis from "./Devis";
import Clients from "./Clients";
import Fournisseurs from "./Fournisseurs";
import Finances from "./Finances";
import Recettes from "./Recettes";
import Utilisateurs from "./Utilisateurs";
import Connexion from "./Connexion";
import Parametres from "./Parametres";
import { apiFetch, fetchStore, saveStore } from "./api";

function App() {
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

  const FAMILLES_PREDEFINIES = [
    {
      nom: "Moteur",
      sousCategories: [
        "Pistons",
        "Segments",
        "Soupapes",
        "Arbre à cames",
        "Coussinets",
        "Turbo",
        "Électrovanne turbo",
        "Vanne EGR",
        "Débitmètre d’air",
        "Porte-filtre avec refroidisseur d’huile",
        "Support moteur",
        "Joints moteur",
        "Joint de culasse",
        "Joint cache-culbuteur",
        "Joint SPI moteur",
        "Fixations moteur",
        "Vis de culasse",
        "Distribution",
        "Kit distribution avec pompe à eau",
        "Kit distribution sans pompe à eau",
        "Courroie de distribution",
        "Kit chaîne de distribution",
        "Poulies moteur",
        "Poulie damper",
        "Poulie arbre à cames",
      ],
    },
    {
      nom: "Système de freinage",
      sousCategories: [
        "Plaquettes de frein",
        "Disques de frein",
        "Tambours",
        "Mâchoires de frein",
        "Étriers",
        "Maître-cylindre",
        "Cylindre de roue",
        "Flexible de frein",
        "Câble de frein",
        "Capteur ABS",
      ],
    },
    {
      nom: "Suspension",
      sousCategories: [
        "Amortisseurs",
        "Ressorts",
        "Coupelles d’amortisseur",
        "Bras de suspension",
        "Silentblocs",
        "Barres stabilisatrices",
      ],
    },
    {
      nom: "Direction",
      sousCategories: [
        "Rotules de direction",
        "Biellettes de direction",
        "Crémaillère de direction",
        "Pompe de direction assistée",
      ],
    },
    {
      nom: "Transmission",
      sousCategories: [
        "Cardans",
        "Arbres de transmission",
        "Différentiel",
        "Joint SPI transmission",
      ],
    },
    {
      nom: "Embrayage",
      sousCategories: [
        "Kit embrayage",
        "Kit embrayage avec volant moteur",
        "Butée d’embrayage",
        "Volant moteur",
        "Émetteur d’embrayage",
        "Récepteur d’embrayage",
        "Guide de butée",
        "Fourchette de butée",
      ],
    },
    {
      nom: "Roues et moyeux",
      sousCategories: ["Roulement de roue", "Moyeu de roue"],
    },
    {
      nom: "Système électrique",
      sousCategories: [
        "Batterie",
        "Alternateur",
        "Poulie d’alternateur",
        "Démarreur",
        "Bougies",
        "Bobines d’allumage",
        "Capteurs",
        "Relais",
        "Fusibles",
      ],
    },
    {
      nom: "Système de refroidissement",
      sousCategories: [
        "Radiateur d’eau",
        "Radiateur de chauffage",
        "Pompe à eau",
        "Thermostat",
        "Ventilateur",
        "Pulseur d’air",
        "Durites",
        "Vase d’expansion",
      ],
    },
    {
      nom: "Système d’alimentation carburant",
      sousCategories: [
        "Pompe à carburant",
        "Injecteurs",
        "Rampe d’injection",
        "Régulateur de pression",
      ],
    },
    {
      nom: "Filtration",
      sousCategories: [
        "Filtre à huile",
        "Filtre à air",
        "Filtre à carburant",
        "Filtre habitacle",
      ],
    },
    {
      nom: "Échappement",
      sousCategories: [
        "Collecteur",
        "Catalyseur",
        "FAP",
        "Silencieux",
        "Tuyaux d’échappement",
      ],
    },
    {
      nom: "Climatisation",
      sousCategories: ["Compresseur de climatisation"],
    },
    {
      nom: "Éclairage",
      sousCategories: ["Phares", "Feux arrière", "Clignotants", "Ampoules"],
    },
    {
      nom: "Carrosserie",
      sousCategories: [
        "Pare-chocs",
        "Capot",
        "Ailes",
        "Portières",
        "Rétroviseurs",
        "Glace de rétroviseur",
        "Calandre",
      ],
    },
    {
      nom: "Accessoires",
      sousCategories: [
        "Kit d’accessoire",
        "Courroie d’accessoire",
        "Essuie-glaces",
        "Klaxon",
        "Tapis de voiture",
        "Cric",
        "Triangle de signalisation",
      ],
    },
    {
      nom: "Huiles",
      sousCategories: [
        "Huiles moteur",
        "Huile moteur 5W30",
        "Huile moteur 5W40",
        "Huile moteur 10W40",
        "Huiles transmission",
        "Huile boîte de vitesses",
        "Huile différentiel",
        "Huile direction assistée",
      ],
    },
    {
      nom: "Liquides et produits",
      sousCategories: [
        "Liquide de frein",
        "Liquide de refroidissement",
        "Additifs moteur",
        "Graisse",
      ],
    },
  ];

  const getStoredSession = () => {
    try {
      const raw = localStorage.getItem("session_utilisateur");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const [utilisateurConnecte, setUtilisateurConnecte] = useState(getStoredSession);
  const [pageActive, setPageActive] = useState("stock");
  const [pieces, setPieces] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [pieceEnCours, setPieceEnCours] = useState(null);
  const [familleActive, setFamilleActive] = useState("");
  const [importEnCours, setImportEnCours] = useState(false);

  const famillesParDefaut = FAMILLES_PREDEFINIES.map((item) => ({
    cle: item.nom.trim().toLowerCase(),
    nom: item.nom,
  }));

  const [aCommander, setACommander] = useState([]);
  const [famillesMemorisees, setFamillesMemorisees] = useState(famillesParDefaut);
  const storesCharges = useRef(false);

  const [formulaire, setFormulaire] = useState({
    famille: "",
    marque: "",
    reference_origine: "",
    reference_interne: "",
    designation: "",
    quantite: 0,
    prix_vente_ttc: "",
    seuil_alerte: 2,
    categorie_vente: "normale",
  });

  const utilisateurEstAdmin = utilisateurConnecte?.type === "administrateur";

  const accesAutorises = useMemo(() => {
    if (!utilisateurConnecte) return [];
    if (utilisateurEstAdmin) return pagesDisponibles.map((p) => p.key);

    return pagesDisponibles
      .filter((p) => utilisateurConnecte.access?.[p.key])
      .map((p) => p.key);
  }, [utilisateurConnecte, utilisateurEstAdmin]);

  useEffect(() => {
    if (!utilisateurConnecte) return;

    if (!accesAutorises.includes(pageActive)) {
      setPageActive(accesAutorises[0] || "stock");
    }
  }, [utilisateurConnecte, accesAutorises, pageActive]);

  const logout = () => {
    localStorage.removeItem("session_utilisateur");
    setUtilisateurConnecte(null);
  };

  useEffect(() => {
    const chargerDonneesComplementaires = async () => {
      const [commandees, familles] = await Promise.all([
        fetchStore("pieces_a_commander", []),
        fetchStore("familles_stock", famillesParDefaut),
      ]);

      setACommander(Array.isArray(commandees) ? commandees : []);

      const base = Array.isArray(familles) ? familles : [];
      const fusion = [...famillesParDefaut];
      base.forEach((item) => {
        if (item?.cle && !fusion.some((f) => f.cle === item.cle)) {
          fusion.push(item);
        }
      });
      setFamillesMemorisees(fusion);
      storesCharges.current = true;
    };

    chargerDonneesComplementaires();
  }, []);

  useEffect(() => {
    if (!storesCharges.current) return;
    saveStore("pieces_a_commander", aCommander).catch(console.error);
  }, [aCommander]);

  useEffect(() => {
    if (!storesCharges.current) return;
    saveStore("familles_stock", famillesMemorisees).catch(console.error);
  }, [famillesMemorisees]);

  const nettoyerFamille = (valeur) =>
    (valeur || "").trim().replace(/\s+/g, " ").toLowerCase();

  const formaterNomFamille = (valeur) => {
    const propre = (valeur || "").trim().replace(/\s+/g, " ");
    if (!propre) return "Sans famille";
    return propre.charAt(0).toUpperCase() + propre.slice(1);
  };

  const designationSuggestions = useMemo(() => {
    const familleTrouvee = FAMILLES_PREDEFINIES.find(
      (f) => nettoyerFamille(f.nom) === nettoyerFamille(formulaire.famille)
    );
    return familleTrouvee ? familleTrouvee.sousCategories : [];
  }, [formulaire.famille]);

  const memoriserFamillesDepuisPieces = (listePieces) => {
    setFamillesMemorisees((prev) => {
      const nouvelles = [...prev];

      listePieces.forEach((piece) => {
        const cle = nettoyerFamille(piece.famille);
        const nom = formaterNomFamille(piece.famille);

        if (!cle) return;

        const existe = nouvelles.some((item) => item.cle === cle);
        if (!existe) {
          nouvelles.push({ cle, nom });
        }
      });

      return nouvelles;
    });
  };

  const ajouterFamilleMemoire = (famille) => {
    const cle = nettoyerFamille(famille);
    const nom = formaterNomFamille(famille);

    if (!cle) return;

    setFamillesMemorisees((prev) => {
      const existe = prev.some((item) => item.cle === cle);
      if (existe) return prev;
      return [...prev, { cle, nom }];
    });
  };

  const chargerStock = async () => {
    try {
      const data = await apiFetch("/api/stock");
      const liste = Array.isArray(data) ? data : [];
      setPieces(liste);
      memoriserFamillesDepuisPieces(liste);
    } catch (error) {
      console.error("Erreur chargement stock :", error);
      setPieces([]);
    }
  };

  useEffect(() => {
    chargerStock();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulaire((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "famille" ? { designation: "" } : {}),
    }));
  };

  const resetFormulaire = () => {
    setFormulaire({
      famille: "",
      marque: "",
      reference_origine: "",
      reference_interne: "",
      designation: "",
      quantite: 0,
      prix_vente_ttc: "",
      seuil_alerte: 2,
      categorie_vente: "normale",
    });
  };

  const enregistrerPiece = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formulaire,
        quantite: Number(formulaire.quantite),
        prix_achat_ht: 0,
        prix_achat_ttc: 0,
        prix_vente_ttc: Number(formulaire.prix_vente_ttc),
        seuil_alerte: Number(formulaire.seuil_alerte),
        code_barres: "",
      };

      const url = modeEdition
        ? `/api/stock/${pieceEnCours.id}`
        : "/api/stock";

      const method = modeEdition ? "PUT" : "POST";

      await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const familleAjoutee = nettoyerFamille(formulaire.famille);
      ajouterFamilleMemoire(formulaire.famille);

      resetFormulaire();
      setModeEdition(false);
      setPieceEnCours(null);
      setAfficherFormulaire(false);
      await chargerStock();

      if (familleAjoutee) {
        setFamilleActive(familleAjoutee);
      }
    } catch (error) {
      alert("Impossible d'enregistrer la pièce.");
      console.error(error);
    }
  };

  const importerExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportEnCours(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) {
        alert("Le fichier Excel est vide.");
        return;
      }

      const lignesValides = rows
        .map((row) => ({
          famille: String(row.famille || "").trim(),
          marque: String(row.marque || "").trim(),
          reference_origine: String(row.reference_origine || "").trim(),
          reference_interne: String(row.reference_interne || "").trim(),
          designation: String(row.designation || "").trim(),
          quantite: Number(row.quantite || 0),
          prix_achat_ht: 0,
          prix_achat_ttc: 0,
          prix_vente_ttc: Number(row.prix_vente_ttc || 0),
          seuil_alerte: Number(row.seuil_alerte || 2),
          categorie_vente:
            String(row.categorie_vente || "").trim() === "top_vente"
              ? "top_vente"
              : "normale",
          code_barres: "",
        }))
        .filter(
          (item) =>
            item.famille &&
            item.marque &&
            item.reference_origine &&
            item.reference_interne &&
            item.designation
        );

      if (!lignesValides.length) {
        alert(
          "Aucune ligne valide trouvée. Vérifie les colonnes : famille, marque, reference_origine, reference_interne, designation, quantite, prix_vente_ttc."
        );
        return;
      }

      for (const ligne of lignesValides) {
        await apiFetch("/api/stock", {
          method: "POST",
          body: JSON.stringify(ligne),
        });

        ajouterFamilleMemoire(ligne.famille);
      }

      await chargerStock();
      alert(`${lignesValides.length} pièce(s) importée(s) avec succès.`);
    } catch (error) {
      console.error(error);
      alert("Erreur pendant l'import Excel.");
    } finally {
      event.target.value = "";
      setImportEnCours(false);
    }
  };

  const modifierPiece = (piece) => {
    setFormulaire({
      famille: piece.famille || "",
      marque: piece.marque || "",
      reference_origine: piece.reference_origine || "",
      reference_interne: piece.reference_interne || "",
      designation: piece.designation || "",
      quantite: piece.quantite || 0,
      prix_vente_ttc: piece.prix_vente_ttc || "",
      seuil_alerte: piece.seuil_alerte || 2,
      categorie_vente: piece.categorie_vente || "normale",
    });

    setPieceEnCours(piece);
    setModeEdition(true);
    setAfficherFormulaire(true);
    setFamilleActive(nettoyerFamille(piece.famille));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const supprimerPiece = async (id) => {
    const confirmation = window.confirm("Voulez-vous supprimer cette pièce ?");
    if (!confirmation) return;

    try {
      await apiFetch(`/api/stock/${id}`, {
        method: "DELETE",
      });

      await chargerStock();
    } catch (error) {
      alert("Impossible de supprimer la pièce.");
      console.error(error);
    }
  };

  const pieceVendue = async (piece) => {
    try {
      if (Number(piece.quantite) > 1) {
        await apiFetch(`/api/stock/${piece.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...piece,
            quantite: Number(piece.quantite) - 1,
            code_barres: "",
          }),
        });
      } else {
        await apiFetch(`/api/stock/${piece.id}`, {
          method: "DELETE",
        });

        ajouterFamilleMemoire(piece.famille);

        setACommander((prev) => {
          const existe = prev.some(
            (p) =>
              p.reference_origine === piece.reference_origine &&
              p.reference_interne === piece.reference_interne &&
              nettoyerFamille(p.famille) === nettoyerFamille(piece.famille)
          );

          if (existe) return prev;

          return [
            ...prev,
            {
              id: `${piece.id}-${Date.now()}`,
              famille: piece.famille,
              marque: piece.marque,
              reference_origine: piece.reference_origine,
              reference_interne: piece.reference_interne,
              designation: piece.designation,
            },
          ];
        });
      }

      await chargerStock();
    } catch (error) {
      alert("Impossible de valider la vente.");
      console.error(error);
    }
  };

  const retirerCommande = (id) => {
    setACommander((prev) => prev.filter((piece) => piece.id !== id));
  };

  const getStatut = (quantite, seuil) => {
    if (Number(quantite) <= 0) {
      return { label: "Rupture", color: "#ef4444" };
    }
    if (Number(quantite) <= Number(seuil || 2)) {
      return { label: "Stock faible", color: "#f97316" };
    }
    return { label: "Stock normal", color: "#22c55e" };
  };

  const piecesFiltrees = useMemo(() => {
    return pieces.filter((piece) => {
      const texte =
        `${piece.famille} ${piece.marque} ${piece.reference_origine} ${piece.reference_interne} ${piece.designation}`.toLowerCase();

      return texte.includes(recherche.toLowerCase());
    });
  }, [pieces, recherche]);

  const famillesMap = useMemo(() => {
    const base = {};

    famillesMemorisees.forEach((famille) => {
      base[famille.cle] = {
        nom: famille.nom,
        top_vente: [],
        normale: [],
        aCommander: [],
        total: 0,
      };
    });

    piecesFiltrees.forEach((piece) => {
      const cle = nettoyerFamille(piece.famille);
      const nom = formaterNomFamille(piece.famille);

      if (!base[cle]) {
        base[cle] = {
          nom,
          top_vente: [],
          normale: [],
          aCommander: [],
          total: 0,
        };
      }

      base[cle].total += 1;

      if (piece.categorie_vente === "top_vente") {
        base[cle].top_vente.push(piece);
      } else {
        base[cle].normale.push(piece);
      }
    });

    aCommander.forEach((piece) => {
      const cle = nettoyerFamille(piece.famille);
      const nom = formaterNomFamille(piece.famille);

      if (!base[cle]) {
        base[cle] = {
          nom,
          top_vente: [],
          normale: [],
          aCommander: [],
          total: 0,
        };
      }

      base[cle].aCommander.push(piece);
    });

    return base;
  }, [piecesFiltrees, famillesMemorisees, aCommander]);

  const famillesListe = useMemo(() => {
    return Object.entries(famillesMap).map(([cle, value]) => ({
      cle,
      ...value,
    }));
  }, [famillesMap]);

  useEffect(() => {
    if (famillesListe.length === 0) {
      setFamilleActive("");
      return;
    }

    const existe = famillesListe.some((famille) => famille.cle === familleActive);

    if (!familleActive || !existe) {
      setFamilleActive(famillesListe[0].cle);
    }
  }, [famillesListe, familleActive]);

  const familleSelectionnee = famillesMap[familleActive];

  const totalPieces = pieces.length;
  const totalStockFaible = pieces.filter(
    (piece) =>
      Number(piece.quantite) > 0 &&
      Number(piece.quantite) <= Number(piece.seuil_alerte || 2)
  ).length;
  const totalRuptures = pieces.filter((piece) => Number(piece.quantite) <= 0).length;
  const totalTopVentes = pieces.filter(
    (piece) => piece.categorie_vente === "top_vente"
  ).length;
  const valeurStock = pieces.reduce((total, piece) => {
    return total + Number(piece.quantite || 0) * Number(piece.prix_vente_ttc || 0);
  }, 0);

  const renderTable = (liste) => {
    if (liste.length === 0) {
      return <p className="empty-category">Aucune pièce dans cette catégorie.</p>;
    }

    return (
      <div className="table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Marque</th>
              <th>Réf origine</th>
              <th>Réf interne</th>
              <th>Désignation</th>
              <th>Quantité</th>
              <th>Vente TTC</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {liste.map((piece) => {
              const statut = getStatut(piece.quantite, piece.seuil_alerte || 2);

              return (
                <tr key={piece.id}>
                  <td>{piece.marque}</td>
                  <td>{piece.reference_origine}</td>
                  <td>{piece.reference_interne}</td>
                  <td>{piece.designation}</td>
                  <td>{piece.quantite}</td>
                  <td>{Number(piece.prix_vente_ttc || 0).toFixed(2)} €</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: statut.color }}>
                      {statut.label}
                    </span>
                  </td>
                  <td>
                    <div className="actions-box">
                      <button className="btn-sold" onClick={() => pieceVendue(piece)}>
                        Vendu
                      </button>
                      <button className="btn-edit" onClick={() => modifierPiece(piece)}>
                        Modifier
                      </button>
                      <button className="btn-delete" onClick={() => supprimerPiece(piece.id)}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTableCommande = (liste) => {
    if (liste.length === 0) {
      return <p className="empty-category">Aucune pièce à commander dans cette famille.</p>;
    }

    return (
      <div className="table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Marque</th>
              <th>Réf origine</th>
              <th>Réf interne</th>
              <th>Désignation</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {liste.map((piece) => (
              <tr key={piece.id}>
                <td>{piece.marque}</td>
                <td>{piece.reference_origine}</td>
                <td>{piece.reference_interne}</td>
                <td>{piece.designation}</td>
                <td>
                  <button className="btn-delete" onClick={() => retirerCommande(piece.id)}>
                    Retirer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStockPage = () => (
    <div className="stock-page">
      <div className="stock-hero">
        <div className="stock-hero-left">
          <p className="breadcrumb">Accueil / Stock</p>
          <h1 className="page-title">Gestion du stock</h1>
          <p className="stock-subtitle">
            Suis tes pièces, tes ruptures, tes meilleures ventes et tes commandes à prévoir.
          </p>

          <div className="header-actions">
            <input
              type="text"
              placeholder="Rechercher une pièce..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="search-input"
            />

            <button
              className="add-button"
              onClick={() => {
                setAfficherFormulaire(!afficherFormulaire);
                if (afficherFormulaire) {
                  setModeEdition(false);
                  setPieceEnCours(null);
                  resetFormulaire();
                }
              }}
            >
              + Ajouter pièce
            </button>

            <label
              className="add-button"
              style={{
                cursor: importEnCours ? "not-allowed" : "pointer",
                opacity: importEnCours ? 0.7 : 1,
              }}
            >
              {importEnCours ? "Import en cours..." : "Importer Excel"}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={importerExcel}
                disabled={importEnCours}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>

        <div className="stock-hero-image">
          <img src={imageKing} alt="King Pieces Autos" />
        </div>
      </div>

      <section
        className="dashboard-grid no-print"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(160px, 1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <div className="dashboard-card">
          <div className="dashboard-title">Pièces totales</div>
          <div className="dashboard-value">{totalPieces}</div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-title">Stock faible</div>
          <div className="dashboard-value">{totalStockFaible}</div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-title">Ruptures</div>
          <div className="dashboard-value">{totalRuptures}</div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-title">Meilleures ventes</div>
          <div className="dashboard-value">{totalTopVentes}</div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-title">Valeur du stock</div>
          <div className="dashboard-value">{valeurStock.toFixed(2)} €</div>
        </div>
      </section>

      {afficherFormulaire && (
        <section className="form-panel no-print">
          <h3 className="panel-title">
            {modeEdition ? "Modifier la pièce" : "Nouvelle pièce"}
          </h3>

          <form onSubmit={enregistrerPiece} className="form-grid">
            <select
              name="famille"
              value={formulaire.famille}
              onChange={handleChange}
              required
            >
              <option value="">Choisir une famille</option>
              {FAMILLES_PREDEFINIES.map((famille) => (
                <option key={famille.nom} value={famille.nom}>
                  {famille.nom}
                </option>
              ))}
            </select>

            <select
              name="designation"
              value={formulaire.designation}
              onChange={handleChange}
              required
            >
              <option value="">Choisir une sous-famille / pièce</option>
              {designationSuggestions.map((designation) => (
                <option key={designation} value={designation}>
                  {designation}
                </option>
              ))}
            </select>

            <input
              name="marque"
              placeholder="Marque"
              value={formulaire.marque}
              onChange={handleChange}
              required
            />
            <input
              name="reference_origine"
              placeholder="Référence origine"
              value={formulaire.reference_origine}
              onChange={handleChange}
              required
            />
            <input
              name="reference_interne"
              placeholder="Référence interne"
              value={formulaire.reference_interne}
              onChange={handleChange}
              required
            />
            <input
              name="quantite"
              type="number"
              placeholder="Quantité"
              value={formulaire.quantite}
              onChange={handleChange}
              required
            />
            <input
              name="prix_vente_ttc"
              type="number"
              step="0.01"
              placeholder="Prix vente TTC"
              value={formulaire.prix_vente_ttc}
              onChange={handleChange}
              required
            />
            <input
              name="seuil_alerte"
              type="number"
              placeholder="Seuil alerte"
              value={formulaire.seuil_alerte}
              onChange={handleChange}
              required
            />

            <select
              name="categorie_vente"
              value={formulaire.categorie_vente}
              onChange={handleChange}
            >
              <option value="normale">Vente normale</option>
              <option value="top_vente">Top vente</option>
            </select>

            <div className="form-actions">
              <button type="submit" className="submit-button">
                {modeEdition ? "Mettre à jour la pièce" : "Enregistrer la pièce"}
              </button>

              {modeEdition && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setModeEdition(false);
                    setPieceEnCours(null);
                    setAfficherFormulaire(false);
                    resetFormulaire();
                  }}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <section className="stock-view">
        <aside className="family-sidebar">
          <div className="family-sidebar-header">
            <h3>Familles</h3>
          </div>

          {famillesListe.length === 0 ? (
            <p className="empty-category">Aucune famille.</p>
          ) : (
            <div className="family-list">
              {famillesListe.map((famille) => (
                <button
                  key={famille.cle}
                  className={
                    familleActive === famille.cle ? "family-item active" : "family-item"
                  }
                  onClick={() => setFamilleActive(famille.cle)}
                >
                  <span>{famille.nom}</span>
                  <span className="family-count">{famille.total}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="stock-content">
          {!familleSelectionnee ? (
            <section className="family-panel">
              <p className="empty-category">Aucune pièce trouvée.</p>
            </section>
          ) : (
            <section className="family-panel">
              <div className="family-header">
                <h2 className="family-title">Famille : {familleSelectionnee.nom}</h2>
              </div>

              <div className="category-block">
                <h3 className="category-title">🔥 Meilleures ventes</h3>
                {renderTable(familleSelectionnee.top_vente)}
              </div>

              <div className="category-block">
                <h3 className="category-title">📦 Vente normale</h3>
                {renderTable(familleSelectionnee.normale)}
              </div>

              <div className="category-block">
                <h3 className="category-title">🛒 Pièces à commander</h3>
                {renderTableCommande(familleSelectionnee.aCommander)}
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );

  const renderCurrentPage = () => {
    if (pageActive === "devis") return <Devis />;
    if (pageActive === "clients") return <Clients />;
    if (pageActive === "fournisseurs") return <Fournisseurs />;
    if (pageActive === "finances") return <Finances />;
    if (pageActive === "recettes") return <Recettes />;
    if (pageActive === "utilisateurs") return <Utilisateurs />;
    if (pageActive === "parametres") return <Parametres />;
    return renderStockPage();
  };

  if (!utilisateurConnecte) {
    return <Connexion onLogin={setUtilisateurConnecte} />;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar no-print">
        <div className="sidebar-top">
          <img src={logo} alt="Logo" className="sidebar-logo" />
          <div>
            <h2 className="brand-title">The King Pieces Autos</h2>
            <p className="brand-subtitle">
              {utilisateurConnecte.nom} • {utilisateurConnecte.type}
            </p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item">🏠 Tableau de bord</div>

          {pagesDisponibles
            .filter((page) => accesAutorises.includes(page.key))
            .map((page) => (
              <div
                key={page.key}
                className={pageActive === page.key ? "nav-item active" : "nav-item"}
                onClick={() => setPageActive(page.key)}
              >
                {page.icon} {page.label}
              </div>
            ))}

          <div className="nav-item" onClick={logout}>
            🚪 Déconnexion
          </div>
        </nav>
      </aside>

      <main className="main-content">{renderCurrentPage()}</main>
    </div>
  );
}

export default App;
