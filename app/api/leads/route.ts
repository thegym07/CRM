import { NextRequest, NextResponse } from 'next/server'
import { createLead, getLeads } from '@/lib/db'

export async function GET() {
  return NextResponse.json(await getLeads())
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  if (!data.nom?.trim()) {
    return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 })
  }
  const lead = await createLead(data)
  return NextResponse.json(lead, { status: 201 })
}
