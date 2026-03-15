# King Pieces Autos - version corrigée

## Déploiement Render (gratuit)

### 1) Base de données PostgreSQL
- Créer une base PostgreSQL sur Render.
- Copier la variable `External Database URL`.

### 2) Web Service
Créer un **Web Service** Render avec ce repo.

Configuration exacte :
- **Root Directory** : `backend`
- **Build Command** : `npm install && npm run build`
- **Start Command** : `npm start`
- **Environment** : `Node`

### 3) Variables d'environnement
Ajouter :
- `DATABASE_URL` = URL PostgreSQL Render
- `NODE_ENV` = `production`

### 4) Première connexion
- utilisateur : `admin`
- mot de passe : `admin123`

## Ce qui a été corrigé
- backend PostgreSQL compatible Render
- frontend React/Vite corrigé
- suppression des appels `localhost`
- connexion utilisateur centralisée
- gestion utilisateurs centralisée
- stock centralisé
- devis centralisés
- clients / fournisseurs / finances / recettes centralisés
- export / import de sauvegarde via API
- le backend sert aussi le frontend en production

## Structure
- `backend/` : API Node/Express + PostgreSQL
- `frontend/king-pieces-app/` : interface React/Vite
