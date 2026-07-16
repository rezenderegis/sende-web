import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function POST(req: NextRequest) {
  const { name, email, phone } = await req.json()

  if (!name || !email || !phone) {
    return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })
  }

  const res = await fetch(`${API_URL}/api/v1/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, source: 'form' }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Erro ao salvar lead' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
