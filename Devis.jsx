import React, { useEffect, useRef, useState } from "react";
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

  const [devisEnregistres, setDevisEnregistres] = useState([]);
  const loaded = useRef(false);

  const [infosClient, setInfosClient] = useState({
    nomClient: "",
    marque: "",
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

  useEffect(() => {
    fetchStore("devis_enregistres", [])
      .then((data) => {
        setDevisEnregistres(Array.isArray(data) ? data : []);
        loaded.current = true;
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    saveStore("devis_enregistres", devisEnregistres).catch(console.error);
  }, [devisEnregistres]);

  const totalLigneTTC = (ligne) =>
    Number(ligne.quantite || 0) * Number(ligne.prixTTC || 0);

  const sousTotalTTC = lignes.reduce((acc, ligne) => acc + totalLigneTTC(ligne), 0);
  const totalTTC = Math.max(0, sousTotalTTC - Number(remiseTTC || 0));

  const ajouterLigne = () => {
    if (!ligneForm.designation.trim()) {
      alert("Entre la désignation de la pièce.");
      return;
    }

    const nouvelleLigne = {
      id: Date.now(),
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
      id: Date.now(),
      infosClient,
      lignes,
      remiseTTC: Number(remiseTTC || 0),
      sousTotalTTC,
      totalTTC,
    };

    setDevisEnregistres((prev) => [devis, ...prev]);
    alert("Devis enregistré avec succès.");
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Devis</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Nom client"
          value={infosClient.nomClient}
          onChange={(e) =>
            setInfosClient((prev) => ({ ...prev, nomClient: e.target.value }))
          }
        />
        <input
          placeholder="Marque"
          value={infosClient.marque}
          onChange={(e) =>
            setInfosClient((prev) => ({ ...prev, marque: e.target.value }))
          }
        />
        <input
          placeholder="Modèle"
          value={infosClient.modele}
          onChange={(e) =>
            setInfosClient((prev) => ({ ...prev, modele: e.target.value }))
          }
        />
        <input
          placeholder="Immatriculation"
          value={infosClient.immatriculation}
          onChange={(e) =>
            setInfosClient((prev) => ({
              ...prev,
              immatriculation: e.target.value,
            }))
          }
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Désignation pièce"
          value={ligneForm.designation}
          onChange={(e) =>
            setLigneForm((prev) => ({ ...prev, designation: e.target.value }))
          }
        />
        <input
          placeholder="Référence"
          value={ligneForm.reference}
          onChange={(e) =>
            setLigneForm((prev) => ({ ...prev, reference: e.target.value }))
          }
        />
        <input
          type="number"
          placeholder="Qté"
          value={ligneForm.quantite}
          onChange={(e) =>
            setLigneForm((prev) => ({ ...prev, quantite: e.target.value }))
          }
        />
        <input
          type="number"
          placeholder="Prix TTC"
          value={ligneForm.prixTTC}
          onChange={(e) =>
            setLigneForm((prev) => ({ ...prev, prixTTC: e.target.value }))
          }
        />
        <button onClick={ajouterLigne}>Ajouter pièce</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        {lignes.length === 0 ? (
          <p>Aucune pièce ajoutée.</p>
        ) : (
          <ul>
            {lignes.map((ligne) => (
              <li key={ligne.id}>
                {ligne.designation} - {ligne.reference || "-"} - {ligne.quantite} x{" "}
                {formatEuro(ligne.prixTTC)} = {formatEuro(totalLigneTTC(ligne))}{" "}
                <button onClick={() => supprimerLigne(ligne.id)}>Supprimer</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Remise TTC </label>
        <input
          type="number"
          value={remiseTTC}
          onChange={(e) => setRemiseTTC(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <div>Sous total TTC : {formatEuro(sousTotalTTC)}</div>
        <div>Remise TTC : {formatEuro(remiseTTC)}</div>
        <div>Total TTC : {formatEuro(totalTTC)}</div>
      </div>

      <button onClick={enregistrerDevis}>Enregistrer le devis</button>

      <hr style={{ margin: "24px 0" }} />

      <h2>Devis enregistrés</h2>
      {devisEnregistres.length === 0 ? (
        <p>Aucun devis enregistré.</p>
      ) : (
        <ul>
          {devisEnregistres.map((devis) => (
            <li key={devis.id}>
              {devis.infosClient.numeroDevis} - {devis.infosClient.nomClient} -{" "}
              {formatEuro(devis.totalTTC)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Devis;
