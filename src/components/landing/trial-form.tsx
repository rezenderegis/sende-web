'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const GAD_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
const GAD_CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL

function fireConversion() {
  if (typeof window === 'undefined' || !window.gtag || !GAD_ID || !GAD_CONVERSION_LABEL) return
  window.gtag('event', 'conversion', {
    send_to: `${GAD_ID}/${GAD_CONVERSION_LABEL}`,
  })
}

export default function TrialForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/trial-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      fireConversion()
      setDone(true)
    } catch {
      setError('Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
          <CheckCircle2 className="h-8 w-8 text-teal-600" />
        </div>
        <h3 className="text-xl font-bold text-teal-900">Recebemos seu contato!</h3>
        <p className="max-w-sm text-sm text-gray-500">
          Nossa equipe vai entrar em contato em até 1 dia útil para configurar seu teste gratuito.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="trial-name" className="mb-1.5 block text-sm font-medium text-gray-700">
            Nome completo <span className="text-coral">*</span>
          </label>
          <input
            id="trial-name"
            type="text"
            required
            autoComplete="name"
            placeholder="João da Silva"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div>
          <label htmlFor="trial-email" className="mb-1.5 block text-sm font-medium text-gray-700">
            E-mail <span className="text-coral">*</span>
          </label>
          <input
            id="trial-email"
            type="email"
            required
            autoComplete="email"
            placeholder="joao@empresa.com.br"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div>
          <label htmlFor="trial-phone" className="mb-1.5 block text-sm font-medium text-gray-700">
            WhatsApp <span className="text-coral">*</span>
          </label>
          <input
            id="trial-phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="(61) 99999-9999"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-pill bg-coral px-8 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-coral-hover disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'TESTE GRÁTIS POR 7 DIAS'
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Sem cartão de crédito · Configuração em 1 dia útil · Cancele quando quiser
      </p>
    </form>
  )
}
