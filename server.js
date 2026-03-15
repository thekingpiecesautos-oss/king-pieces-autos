import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "king-pieces-secret";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'employe',
        access JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock (
        id SERIAL PRIMARY KEY,
        famille VARCHAR(255),
        marque VARCHAR(255),
        reference_origine VARCHAR(255),
        reference_interne VARCHAR(255),
        designation VARCHAR(255),
        quantite INTEGER DEFAULT 0,
        prix_achat_ht NUMERIC(10,2) DEFAULT 0,
        prix_achat_ttc NUMERIC(10,2) DEFAULT 0,
        prix_vente_ttc NUMERIC(10,2) DEFAULT 0,
        seuil_alerte INTEGER DEFAULT 2,
        categorie_vente VARCHAR(50) DEFAULT 'normale',
        code_barres VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS devis (
        id SERIAL PRIMARY KEY,
        numero VARCHAR(255),
        client JSONB,
        vehicule JSONB,
        lignes JSONB,
        total NUMERIC(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255),
        telephone VARCHAR(255),
        email VARCHAR(255),
        adresse TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fournisseurs (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255),
        telephone VARCHAR(255),
        email VARCHAR(255),
        adresse TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS finances (
        id SERIAL PRIMARY KEY,
        libelle VARCHAR(255),
        montant NUMERIC(10,2) DEFAULT 0,
        type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS recettes (
        id SERIAL PRIMARY KEY,
        libelle VARCHAR(255),
        montant NUMERIC(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const adminCheck = await pool.query(
      "SELECT * FROM utilisateurs WHERE username = $1",
      ["admin"]
    );

    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash("admin123", 10);

      await pool.query(
        `
        INSERT INTO utilisateurs (nom, username, password, type, access)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          "Administrateur",
          "admin",
          hash,
          "administrateur",
          JSON.stringify({
            stock: true,
            devis: true,
            clients: true,
            fournisseurs: true,
            finances: true,
            recettes: true,
            utilisateurs: true,
            parametres: true,
          }),
        ]
      );

      console.log("Compte admin créé : admin / admin123");
    }

    console.log("Base PostgreSQL prête");
  } catch (error) {
    console.error("Erreur initialisation base :", error);
  }
}

app.get("/", (req, res) => {
  res.json({ message: "API King Pieces Autos OK" });
});

app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      dbTime: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur base de données" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM utilisateurs WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        type: user.type,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      utilisateur: {
        id: user.id,
        nom: user.nom,
        username: user.username,
        type: user.type,
        access: user.access || {},
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur login" });
  }
});

app.get("/api/utilisateurs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nom, username, type, access, created_at
      FROM utilisateurs
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur chargement utilisateurs" });
  }
});

app.post("/api/utilisateurs", async (req, res) => {
  try {
    const { nom, username, password, type, access } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO utilisateurs (nom, username, password, type, access)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nom, username, type, access, created_at
      `,
      [nom, username, hash, type || "employe", JSON.stringify(access || {})]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur création utilisateur" });
  }
});

app.put("/api/utilisateurs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, username, password, type, access } = req.body;

    if (password && password.trim() !== "") {
      const hash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `
        UPDATE utilisateurs
        SET nom = $1, username = $2, password = $3, type = $4, access = $5
        WHERE id = $6
        RETURNING id, nom, username, type, access, created_at
        `,
        [nom, username, hash, type, JSON.stringify(access || {}), id]
      );

      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      `
      UPDATE utilisateurs
      SET nom = $1, username = $2, type = $3, access = $4
      WHERE id = $5
      RETURNING id, nom, username, type, access, created_at
      `,
      [nom, username, type, JSON.stringify(access || {}), id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur modification utilisateur" });
  }
});

app.delete("/api/utilisateurs/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM utilisateurs WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur suppression utilisateur" });
  }
});

app.get("/api/stock", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM stock ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur chargement stock" });
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
      prix_achat_ht,
      prix_achat_ttc,
      prix_vente_ttc,
      seuil_alerte,
      categorie_vente,
      code_barres,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO stock (
        famille, marque, reference_origine, reference_interne, designation,
        quantite, prix_achat_ht, prix_achat_ttc, prix_vente_ttc,
        seuil_alerte, categorie_vente, code_barres
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
      `,
      [
        famille,
        marque,
        reference_origine,
        reference_interne,
        designation,
        quantite || 0,
        prix_achat_ht || 0,
        prix_achat_ttc || 0,
        prix_vente_ttc || 0,
        seuil_alerte || 2,
        categorie_vente || "normale",
        code_barres || "",
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur ajout stock" });
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
      prix_achat_ht,
      prix_achat_ttc,
      prix_vente_ttc,
      seuil_alerte,
      categorie_vente,
      code_barres,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE stock
      SET famille = $1,
          marque = $2,
          reference_origine = $3,
          reference_interne = $4,
          designation = $5,
          quantite = $6,
          prix_achat_ht = $7,
          prix_achat_ttc = $8,
          prix_vente_ttc = $9,
          seuil_alerte = $10,
          categorie_vente = $11,
          code_barres = $12
      WHERE id = $13
      RETURNING *
      `,
      [
        famille,
        marque,
        reference_origine,
        reference_interne,
        designation,
        quantite || 0,
        prix_achat_ht || 0,
        prix_achat_ttc || 0,
        prix_vente_ttc || 0,
        seuil_alerte || 2,
        categorie_vente || "normale",
        code_barres || "",
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur modification stock" });
  }
});

app.delete("/api/stock/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM stock WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur suppression stock" });
  }
});

app.get("/api/devis", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM devis ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur chargement devis" });
  }
});

app.post("/api/devis", async (req, res) => {
  try {
    const { numero, client, vehicule, lignes, total } = req.body;

    const result = await pool.query(
      `
      INSERT INTO devis (numero, client, vehicule, lignes, total)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        numero || "",
        JSON.stringify(client || {}),
        JSON.stringify(vehicule || {}),
        JSON.stringify(lignes || []),
        total || 0,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur création devis" });
  }
});

app.get("/api/clients", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clients ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur chargement clients" });
  }
});

app.post("/api/clients", async (req, res) => {
  try {
    const { nom, telephone, email, adresse } = req.body;

    const result = await pool.query(
      `
      INSERT INTO clients (nom, telephone, email, adresse)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [nom, telephone, email, adresse]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur création client" });
  }
});

app.get("/api/fournisseurs", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM fournisseurs ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur chargement fournisseurs" });
  }
});

app.post("/api/fournisseurs", async (req, res) => {
  try {
    const { nom, telephone, email, adresse } = req.body;

    const result = await pool.query(
      `
      INSERT INTO fournisseurs (nom, telephone, email, adresse)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [nom, telephone, email, adresse]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur création fournisseur" });
  }
});

app.get("/api/finances", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM finances ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur chargement finances" });
  }
});

app.post("/api/finances", async (req, res) => {
  try {
    const { libelle, montant, type } = req.body;

    const result = await pool.query(
      `
      INSERT INTO finances (libelle, montant, type)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [libelle, montant || 0, type || ""]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur création finance" });
  }
});

app.get("/api/recettes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recettes ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur chargement recettes" });
  }
});

app.post("/api/recettes", async (req, res) => {
  try {
    const { libelle, montant } = req.body;

    const result = await pool.query(
      `
      INSERT INTO recettes (libelle, montant)
      VALUES ($1, $2)
      RETURNING *
      `,
      [libelle, montant || 0]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur création recette" });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
