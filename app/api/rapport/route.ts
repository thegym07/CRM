import { NextRequest, NextResponse } from 'next/server'
import { getReport, upsertReport } from '@/lib/reports'

export async function GET(request: NextRequest) {
  const date = new URL(request.url).searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  return NextResponse.json(getReport(date))
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  return NextResponse.json(upsertReport(data))
}
