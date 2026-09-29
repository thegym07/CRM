-- CRM THE GYM — Schéma Supabase (à jour)
-- À exécuter dans l'éditeur SQL de Supabase (SQL Editor > New query > Run)

-- =========================
--  Table LEADS (prospects)
-- =========================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  source TEXT DEFAULT 'Autre',
  -- 'Meta Ads' | 'Bouche-à-oreille' | 'Passage' | 'Formulaire web' | 'Autre'
  date_rdv TIMESTAMPTZ,
  activite TEXT,
  -- 'cours collectif' | 'plateau muscu' | 'coaching'
  rdv_honore BOOLEAN,           -- null = En attente, true = Oui, false = Non
  resultat_rdv TEXT,            -- 'Vendu' | 'À relancer' | 'Refus' | null
  statut TEXT DEFAULT 'Nouveau prospect',
  -- 'Nouveau prospect' | 'Contacté sans réponse' | 'À relancer' | 'RDV pris' | 'Vendu' | 'Refus'
  offre_souscrite TEXT,
  coach_assigne TEXT,
  date_relance DATE,
  motif_relance TEXT,
  suivi_relance TEXT,           -- 'À appeler' | 'Pas de réponse' | 'RDV repris' | 'Perdu' | null
  notes TEXT,
  appels JSONB DEFAULT '[]'::jsonb,  -- tableau d'horodatages ISO des tentatives d'appel
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- =========================
--  Table REPORTS (rapport journalier)
-- =========================
CREATE TABLE IF NOT EXISTS reports (
  date DATE PRIMARY KEY,
  appels_passes INT,
  personnes_au_tel INT,
  rdv_pris INT,
  sms_envoyes BOOLEAN DEFAULT FALSE
);

ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- =========================
--  Table COMMISSIONS (bonus commerciale, figées)
-- =========================
-- Créée quand la présence d'un RDV passe à « Oui ». Pas de clé étrangère :
-- supprimer le prospect ne supprime PAS la commission (retrait manuel uniquement).
CREATE TABLE IF NOT EXISTS commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID,
  nom TEXT NOT NULL,
  date_rdv TIMESTAMPTZ NOT NULL,
  montant INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE commissions DISABLE ROW LEVEL SECURITY;

-- =========================
--  Table COACHES (agenda)
-- =========================
CREATE TABLE IF NOT EXISTS coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  couleur TEXT NOT NULL DEFAULT '#F5C800',
  email TEXT,
  ical_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;

-- =========================
--  Table CRENEAUX (dispos + RDV bloqués)
-- =========================
-- lead_id NULL = disponibilité libre ; renseigné = créneau réservé.
-- UNIQUE(coach_id, debut) = verrou anti-doublon côté base.
CREATE TABLE IF NOT EXISTS creneaux (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  debut TIMESTAMPTZ NOT NULL,
  fin TIMESTAMPTZ NOT NULL,
  lead_id UUID,
  lead_nom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (coach_id, debut)
);

ALTER TABLE creneaux DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS creneaux_debut_idx ON creneaux(debut);

-- =========================
--  updated_at automatique
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =========================
--  Index
-- =========================
CREATE INDEX IF NOT EXISTS leads_statut_idx ON leads(statut);
CREATE INDEX IF NOT EXISTS leads_date_relance_idx ON leads(date_relance);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
