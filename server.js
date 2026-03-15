const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIST = path.join(__dirname, "..", "frontend", "king-pieces-app", "dist");
const IS_PROD = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.PGUSER || "postgres",
      host: process.env.PGHOST || "127.0.0.1",
      database: process.env.PGDATABASE || "king_pieces_autos",
      password: process.env.PGPASSWORD || "postgres",
      port: Number(process.env.PGPORT || 5432),
    });

const DEFAULT_ACCESS = {
  stock: true,
  devis: true,
  clients: true,
  fournisseurs: true,
  finances: true,
  recettes: true,
  utilisateurs: true,
  parametres: true,
};

const STORE_DEFAULTS = {
  pieces_a_commander: [],
  familles_stock: [],
  devis_enregistres: [],
  clients: [],
  fournisseurs: [],
  finances_data: { cheques: [], virements: [], especes: [], depots: [] },
  recettes_data: { cartesBleues: [], especes: [] },
};

async function query(text, params = []) {
  return pool.query(text, params);
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS pieces (
      id SERIAL PRIMARY KEY,
      famille TEXT NOT NULL,
      marque TEXT NOT NULL,
      reference_origine TEXT NOT NULL,
      reference_interne TEXT NOT NULL,
      designation TEXT NOT NULL,
      quantite INTEGER NOT NULL DEFAULT 0,
      prix_achat_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
      prix_achat_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
      prix_vente_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
      seuil_alerte INTEGER NOT NULL DEFAULT 2,
      code_barres TEXT DEFAULT '',
      categorie_vente TEXT NOT NULL DEFAULT 'normale',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_pieces_reference_interne ON pieces(reference_interne);
    CREATE INDEX IF NOT EXISTS idx_pieces_reference_origine ON pieces(reference_origine);
    CREATE INDEX IF NOT EXISTS idx_pieces_designation ON pieces(designation);
    CREATE INDEX IF NOT EXISTS idx_pieces_famille ON pieces(famille);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS utilisateurs (
      id SERIAL PRIMARY KEY,
      nom TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'vendeur',
      actif BOOLEAN NOT NULL DEFAULT TRUE,
      access JSONB NOT NULL DEFAULT '{}'::jsonb,
      date_creation DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS app_store (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT 'null'::jsonb,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  const admin = await query(`SELECT id FROM utilisateurs WHERE username = $1 LIMIT 1`, ["admin"]);
  if (admin.rowCount === 0) {
    await query(
      `INSERT INTO utilisateurs (nom, username, password, type, actif, access, date_creation)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, CURRENT_DATE)`,
      ["Administrateur", "admin", "admin123", "administrateur", true, JSON.stringify(DEFAULT_ACCESS)]
    );
  }

  for (const [key, value] of Object.entries(STORE_DEFAULTS)) {
    await query(
      `INSERT INTO app_store (key, value) VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(value)]
    );
  }
}

function normalizeUser(row) {
  return {
    id: row.id,
    nom: row.nom,
    username: row.username,
    password: row.password,
    type: row.type,
    actif: row.actif,
    access: row.type === "administrateur" ? DEFAULT_ACCESS : { ...DEFAULT_ACCESS, ...row.access },
    dateCreation: row.date_creation,
  };
}

function normalizePiece(row) {
  return {
    ...row,
    quantite: Number(row.quantite || 0),
    prix_achat_ht: Number(row.prix_achat_ht || 0),
    prix_achat_ttc: Number(row.prix_achat_ttc || 0),
    prix_vente_ttc: Number(row.prix_vente_ttc || 0),
    seuil_alerte: Number(row.seuil_alerte || 0),
  };
}

app.get("/api/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  try {
    const result = await query(`SELECT * FROM utilisateurs WHERE LOWER(username) = LOWER($1) LIMIT 1`, [username || ""]);
    if (result.rowCount === 0) return res.status(401).json({ erreur: "Utilisateur introuvable" });
    const user = result.rows[0];
    if (!user.actif) return res.status(403).json({ erreur: "Compte inactif" });
    if (user.password !== String(password || "")) return res.status(401).json({ erreur: "Mot de passe incorrect" });
    res.json(normalizeUser(user));
  } catch (error) {
    res.status(500).json({ erreur: "Erreur serveur", detail: error.message });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM utilisateurs ORDER BY id DESC`);
    res.json(result.rows.map(normalizeUser));
  } catch (error) {
    res.status(500).json({ erreur: "Impossible de lire les utilisateurs", detail: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  const { nom, username, password, type = "vendeur", actif = true, access = DEFAULT_ACCESS } = req.body || {};
  try {
    const exists = await query(`SELECT id FROM utilisateurs WHERE LOWER(username) = LOWER($1)`, [username || ""]);
    if (exists.rowCount > 0) return res.status(400).json({ erreur: "Ce nom d'utilisateur existe déjà" });
    const result = await query(
      `INSERT INTO utilisateurs (nom, username, password, type, actif, access, date_creation)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,CURRENT_DATE)
       RETURNING *`,
      [nom, username, password, type, Boolean(actif), JSON.stringify(type === "administrateur" ? DEFAULT_ACCESS : access)]
    );
    res.status(201).json(normalizeUser(result.rows[0]));
  } catch (error) {
    res.status(500).json({ erreur: "Impossible de créer l'utilisateur", detail: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { nom, username, password, type = "vendeur", actif = true, access = DEFAULT_ACCESS } = req.body || {};
  try {
    const exists = await query(`SELECT id FROM utilisateurs WHERE LOWER(username)=LOWER($1) AND id <> $2`, [username || "", id]);
    if (exists.rowCount > 0) return res.status(400).json({ erreur: "Ce nom d'utilisateur existe déjà" });
    const result = await query(
      `UPDATE utilisateurs
       SET nom=$1, username=$2, password=$3, type=$4, actif=$5, access=$6::jsonb, updated_at=NOW()
       WHERE id=$7
       RETURNING *`,
      [nom, username, password, type, Boolean(actif), JSON.stringify(type === "administrateur" ? DEFAULT_ACCESS : access), id]
    );
    if (result.rowCount === 0) return res.status(404).json({ erreur: "Utilisateur introuvable" });
    res.json(normalizeUser(result.rows[0]));
  } catch (error) {
    res.status(500).json({ erreur: "Impossible de modifier l'utilisateur", detail: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(`DELETE FROM utilisateurs WHERE id=$1 RETURNING id`, [id]);
    if (result.rowCount === 0) return res.status(404).json({ erreur: "Utilisateur introuvable" });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ erreur: "Impossible de supprimer l'utilisateur", detail: error.message });
  }
});

app.get("/api/stock", async (_req, res) => {
  try {
    const result = await query("SELECT * FROM pieces ORDER BY id DESC");
    res.json(result.rows.map(normalizePiece));
  } catch (error) {
    res.status(500).json({ erreur: "Impossible de lire le stock", detail: error.message });
  }
});

app.post("/api/stock", async (req, res) => {
  try {
    const {
      famille,
      marque,
      reference_origine,
      reference_interne,
      designation,
      quantite,
      prix_achat_ht = 0,
      prix_achat_ttc = 0,
      prix_vente_ttc = 0,
      seuil_alerte = 2,
      code_barres = "",
      categorie_vente = "normale",
    } = req.body || {};

    const result = await query(
      `INSERT INTO pieces (
        famille, marque, reference_origine, reference_interne, designation,
        quantite, prix_achat_ht, prix_achat_ttc, prix_vente_ttc,
        seuil_alerte, code_barres, categorie_vente
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        famille, marque, reference_origine, reference_interne, designation,
        Number(quantite || 0), Number(prix_achat_ht || 0), Number(prix_achat_ttc || 0), Number(prix_vente_ttc || 0),
        Number(seuil_alerte || 2), code_barres || "", categorie_vente || "normale"
      ]
    );
    res.status(201).json(normalizePiece(result.rows[0]));
  } catch (error) {
    res.status(500).json({ erreur: "Impossible d'ajouter la pièce", detail: error.message });
  }
});

app.put("/api/stock/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      famille,
      marque,
      reference_origine,
      reference_interne,
      designation,
      quantite,
      prix_achat_ht = 0,
      prix_achat_ttc = 0,
      prix_vente_ttc = 0,
      seuil_alerte = 2,
      code_barres = "",
      categorie_vente = "normale",
    } = req.body || {};

    const result = await query(
      `UPDATE pieces SET
        famille=$1, marque=$2, reference_origine=$3, reference_interne=$4, designation=$5,
        quantite=$6, prix_achat_ht=$7, prix_achat_ttc=$8, prix_vente_ttc=$9,
        seuil_alerte=$10, code_barres=$11, categorie_vente=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [
        famille, marque, reference_origine, reference_interne, designation,
        Number(quantite || 0), Number(prix_achat_ht || 0), Number(prix_achat_ttc || 0), Number(prix_vente_ttc || 0),
        Number(seuil_alerte || 2), code_barres || "", categorie_vente || "normale", id
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ erreur: "Pièce introuvable" });
    res.json(normalizePiece(result.rows[0]));
  } catch (error) {
    res.status(500).json({ erreur: "Impossible de modifier la pièce", detail: error.message });
  }
});

app.delete("/api/stock/:id", async (req, res) => {
  try {
    const result = await query(`DELETE FROM pieces WHERE id=$1 RETURNING id`, [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ erreur: "Pièce introuvable" });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ erreur: "Impossible de supprimer la pièce", detail: error.message });
  }
});

app.get("/api/store/:key", async (req, res) => {
  const key = req.params.key;
  try {
    const result = await query(`SELECT value FROM app_store WHERE key=$1`, [key]);
    if (result.rowCount === 0) {
      const fallback = STORE_DEFAULTS[key] ?? null;
      return res.json(fallback);
    }
    res.json(result.rows[0].value);
  } catch (error) {
    res.status(500).json({ erreur: "Impossible de lire les données", detail: error.message });
  }
});

app.put("/api/store/:key", async (req, res) => {
  const key = req.params.key;
  const value = req.body?.value;
  try {
    await query(
      `INSERT INTO app_store (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ erreur: "Impossible d'enregistrer les données", detail: error.message });
  }
});

app.get("/api/settings/export", async (_req, res) => {
  try {
    const pieces = await query(`SELECT * FROM pieces ORDER BY id DESC`);
    const users = await query(`SELECT * FROM utilisateurs ORDER BY id DESC`);
    const store = await query(`SELECT key, value FROM app_store ORDER BY key`);
    const donnees = { stock: pieces.rows.map(normalizePiece), utilisateurs_data: users.rows.map(normalizeUser) };
    for (const row of store.rows) donnees[row.key] = row.value;
    res.json({ version: "2.0", logiciel: "The King Pieces Autos", dateSauvegarde: new Date().toISOString(), donnees });
  } catch (error) {
    res.status(500).json({ erreur: "Impossible d'exporter les données", detail: error.message });
  }
});

app.post("/api/settings/import", async (req, res) => {
  const donnees = req.body?.donnees;
  if (!donnees || typeof donnees !== "object") return res.status(400).json({ erreur: "Sauvegarde invalide" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM pieces");
    if (Array.isArray(donnees.stock)) {
      for (const p of donnees.stock) {
        await client.query(
          `INSERT INTO pieces (famille, marque, reference_origine, reference_interne, designation, quantite, prix_achat_ht, prix_achat_ttc, prix_vente_ttc, seuil_alerte, code_barres, categorie_vente)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [p.famille, p.marque, p.reference_origine, p.reference_interne, p.designation, Number(p.quantite || 0), Number(p.prix_achat_ht || 0), Number(p.prix_achat_ttc || 0), Number(p.prix_vente_ttc || 0), Number(p.seuil_alerte || 2), p.code_barres || "", p.categorie_vente || "normale"]
        );
      }
    }

    if (Array.isArray(donnees.utilisateurs_data)) {
      await client.query("DELETE FROM utilisateurs");
      for (const u of donnees.utilisateurs_data) {
        await client.query(
          `INSERT INTO utilisateurs (nom, username, password, type, actif, access, date_creation)
           VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
          [u.nom || "", u.username || "", u.password || "", u.type || "vendeur", Boolean(u.actif), JSON.stringify(u.access || DEFAULT_ACCESS), u.dateCreation || new Date().toISOString().split("T")[0]]
        );
      }
    }

    const genericKeys = Object.keys(STORE_DEFAULTS);
    for (const key of genericKeys) {
      const value = donnees[key] ?? STORE_DEFAULTS[key];
      await client.query(
        `INSERT INTO app_store (key, value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, JSON.stringify(value)]
      );
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ erreur: "Impossible de restaurer la sauvegarde", detail: error.message });
  } finally {
    client.release();
  }
});

if (IS_PROD) {
  app.use(express.static(FRONTEND_DIST));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur lancé sur le port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erreur démarrage serveur:", error);
    process.exit(1);
  });
