'use client'

import { useState } from 'react'
import { ShieldAlert, Trash2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

const WHAT_IS_DELETED = [
  'Sua conta de usuário e credenciais de acesso',
  'Histórico de conversas e mensagens',
  'Contatos e dados associados',
  'Configurações personalizadas e preferências',
  'Histórico de broadcasts enviados',
]

const WHAT_IS_KEPT = [
  'Logs de auditoria exigidos por lei (até 6 meses)',
  'Dados necessários para obrigações legais ou fiscais',
]

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !confirmed) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), reason: reason.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Ocorreu um erro. Tente novamente.')
    }
  }

  if (status === 'success') {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
              <CheckCircle2 className="h-10 w-10 text-teal-600" />
            </div>
          </div>
          <h1 className="mb-3 font-display text-2xl font-bold text-teal-900">
            Solicitação recebida
          </h1>
          <p className="text-ink-soft mb-6 text-base leading-relaxed">
            Recebemos sua solicitação de exclusão de conta para{' '}
            <span className="font-semibold text-ink">{email}</span>.
            <br /><br />
            Iremos processar sua solicitação em até <strong>30 dias úteis</strong>. Você receberá
            uma confirmação no e-mail cadastrado quando a exclusão for concluída.
          </p>
          <p className="text-sm text-ink-soft/70">
            Em caso de dúvidas, entre em contato: <a href="mailto:suporte@sende.com.br" className="text-teal-600 underline">suporte@sende.com.br</a>
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 md:py-24">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <Trash2 className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <h1 className="mb-3 font-display text-3xl font-bold text-teal-900 md:text-4xl">
          Solicitar exclusão de conta
        </h1>
        <p className="text-ink-soft mx-auto max-w-md text-base">
          Esta ação é <strong className="text-ink">permanente e irreversível</strong>. Leia com atenção
          antes de prosseguir.
        </p>
      </div>

      {/* O que será excluído */}
      <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
            <span className="text-sm font-semibold text-red-700">
              O que será excluído permanentemente
            </span>
          </div>
          {showDetails
            ? <ChevronUp className="h-4 w-4 text-red-400" />
            : <ChevronDown className="h-4 w-4 text-red-400" />}
        </button>
        {showDetails && (
          <ul className="mt-4 space-y-2">
            {WHAT_IS_DELETED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-red-700">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* O que é mantido */}
      <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Dados que precisam ser mantidos por obrigação legal:
            </p>
            <ul className="mt-2 space-y-1">
              {WHAT_IS_KEPT.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-amber-700">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            E-mail da conta <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div>
          <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-ink">
            Motivo da exclusão{' '}
            <span className="text-ink-soft font-normal">(opcional)</span>
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nos ajude a melhorar contando o motivo..."
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:bg-gray-100">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-teal-600"
          />
          <span className="text-sm text-ink-soft leading-relaxed">
            Entendo que a exclusão da conta é <strong className="text-ink">permanente e irreversível</strong>,
            e que todos os dados listados acima serão removidos definitivamente.
          </span>
        </label>

        {status === 'error' && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={!email.trim() || !confirmed || status === 'loading'}
          className="w-full rounded-pill bg-red-500 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'loading' ? 'Enviando solicitação...' : 'Solicitar exclusão da minha conta'}
        </button>

        <p className="text-center text-xs text-ink-soft/70">
          Dúvidas?{' '}
          <a href="mailto:suporte@sende.com.br" className="text-teal-600 underline">
            Entre em contato
          </a>
        </p>
      </form>
    </section>
  )
}
