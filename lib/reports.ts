import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export type DailyReport = {
  date: string          // YYYY-MM-DD
  appels_passes: number | null
  personnes_au_tel: number | null
  rdv_pris: number | null
  sms_envoyes: boolean
}

const DB_PATH = join(process.cwd(), 'data', 'reports.json')

export function getReports(): DailyReport[] {
  if (!existsSync(DB_PATH)) return []
  try { return JSON.parse(readFileSync(DB_PATH, 'utf-8')) } catch { return [] }
}

export function getReport(date: string): DailyReport | null {
  return getReports().find(r => r.date === date) ?? null
}

export function upsertReport(data: DailyReport): DailyReport {
  const reports = getReports()
  const idx = reports.findIndex(r => r.date === data.date)
  if (idx >= 0) { reports[idx] = data } else { reports.push(data) }
  writeFileSync(DB_PATH, JSON.stringify(reports, null, 2))
  return data
}
