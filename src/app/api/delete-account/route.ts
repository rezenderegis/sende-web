import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, reason } = body as { email?: string; reason?: string }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    // Registra a solicitação no console para rastreamento
    console.info('[delete-account] Nova solicitação de exclusão', {
      email,
      reason: reason || '(não informado)',
      receivedAt: new Date().toISOString(),
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    })

    // TODO: quando disponível, integrar uma das opções abaixo:
    // 1. Enviar e-mail via Resend/SendGrid para suporte@sende.com.br
    // 2. Criar ticket no sistema interno
    // 3. Chamar endpoint da API para soft-delete + agendar exclusão

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
