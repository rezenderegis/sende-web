import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function POST(req: NextRequest) {
  const { name, email, phone, brand, website } = await req.json()

  // honeypot: campo invisível que só bots preenchem — finge sucesso sem gravar nada
  if (website) {
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  if (!name || !email || !phone) {
    return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })
  }

  const res = await fetch(`${API_URL}/api/v1/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, source: 'form', brand: brand === 'globalsix' ? 'globalsix' : 'sende' }),
  })

  if (!res.ok) {
    const error = res.status === 400 ? 'E-mail ou telefone inválido' : 'Erro ao salvar lead'
    return NextResponse.json({ error }, { status: res.status === 400 ? 400 : 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
