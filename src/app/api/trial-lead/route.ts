import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { name, email, phone } = await req.json()

  if (!name || !email || !phone) {
    return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })
  }

  // TODO: integrar com CRM / Resend / planilha
  console.log('[trial-lead]', { name, email, phone, at: new Date().toISOString() })

  return NextResponse.json({ ok: true })
}
