# THE GYM — CRM Prospects

CRM interne pour THE GYM (Ardèche). Gestion des prospects, RDV, relances et leads Meta Ads.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** (PostgreSQL)
- **Tailwind CSS** (dark mode, mobile-first)
- **Vercel** (déploiement)

---

## Mise en production — étapes

### 1. Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → New project
2. Copier dans Settings > API :
   - `URL du projet`
   - `anon public key`
   - `service_role key`
3. Dans l'éditeur SQL de Supabase, exécuter le contenu de `supabase/schema.sql`

### 2. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplir `.env.local` avec tes valeurs Supabase et les identifiants de connexion.

### 3. Installer les dépendances

```bash
npm install
```

### 4. Importer les données CSV existantes

```bash
npm run import-csv
```

Le script lit automatiquement `~/Downloads/Prospects THE GYM - Show-up.csv` et l'importe dans Supabase.

### 5. Lancer en local

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### 6. Déployer sur Vercel

```bash
npx vercel
```

Ou connecter le dépôt GitHub à Vercel et ajouter les variables d'environnement dans le dashboard Vercel.

---

## Webhook Meta Lead Ads

Pour recevoir les leads Facebook automatiquement :

1. Dans Meta Business Manager, configurer un webhook vers :
   ```
   https://ton-domaine.vercel.app/api/leads/meta
   ```
2. Utiliser la valeur `WEBHOOK_SECRET` de `.env.local` comme token de vérification
3. Champs à mapper : `first_name`, `last_name`, `phone_number`, `email`

Les leads arriveront automatiquement avec statut "Nouveau" et source "Meta Ads".

---

## Identifiants de connexion

- URL : `https://ton-domaine.vercel.app`
- Identifiant : valeur de `ADMIN_USERNAME` dans `.env.local`
- Mot de passe : valeur de `ADMIN_PASSWORD` dans `.env.local`

La session dure 30 jours. Un seul compte partagé pour toute l'équipe.
