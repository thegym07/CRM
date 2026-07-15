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
