-- CRM THE GYM - Schéma Supabase
-- À exécuter dans l'éditeur SQL de Supabase

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  source TEXT DEFAULT 'Autre',
  -- Valeurs : 'Meta Ads' | 'Bouche-à-oreille' | 'Passage' | 'Autre'
  date_rdv TIMESTAMPTZ,
  activite TEXT,
  -- Valeurs : 'cours collectif' | 'plateau muscu' | 'coaching'
  rdv_honore BOOLEAN DEFAULT FALSE,
  statut TEXT DEFAULT 'Nouveau',
  -- Valeurs : 'Nouveau' | 'RDV planifié' | 'RDV honoré' | 'Vendu' | 'Perdu/À relancer'
  offre_souscrite TEXT,
  coach_assigne TEXT,
  date_relance DATE,
  motif_relance TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Désactiver RLS (app interne, compte partagé unique)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index pour les filtres fréquents
CREATE INDEX IF NOT EXISTS leads_statut_idx ON leads(statut);
CREATE INDEX IF NOT EXISTS leads_date_relance_idx ON leads(date_relance);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
