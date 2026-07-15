import { supabase } from './supabaseServer'

export type DailyReport = {
  date: string          // YYYY-MM-DD
  appels_passes: number | null
  personnes_au_tel: number | null
  rdv_pris: number | null
  sms_envoyes: boolean
}

const TABLE = 'reports'

export async function getReports(): Promise<DailyReport[]> {
  const { data, error } = await supabase.from(TABLE).select('*').order('date', { ascending: false })
  if (error) throw new Error(`getReports: ${error.message}`)
  return (data ?? []) as DailyReport[]
}

export async function getReport(date: string): Promise<DailyReport | null> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('date', date).maybeSingle()
  if (error) throw new Error(`getReport: ${error.message}`)
  return (data as DailyReport) ?? null
}

export async function upsertReport(data: DailyReport): Promise<DailyReport> {
  const { data: row, error } = await supabase
    .from(TABLE)
    .upsert(data, { onConflict: 'date' })
    .select('*')
    .single()
  if (error) throw new Error(`upsertReport: ${error.message}`)
  return row as DailyReport
}
