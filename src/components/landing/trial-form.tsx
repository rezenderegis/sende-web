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
const GAD_WA_CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_WA_CONVERSION_LABEL

const WA_NUMBER = '5561993796669'
const WA_MESSAGE = encodeURIComponent('Olá! Quero conhecer o Sende e fazer o teste gratuito.')

function fireConversion(label: string | undefined) {
  if (typeof window === 'undefined' || !window.gtag || !GAD_ID || !label) return
  window.gtag('event', 'conversion', { send_to: `${GAD_ID}/${label}` })
}

export default function TrialForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', website: '' })
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
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error)
      }
      fireConversion(GAD_CONVERSION_LABEL)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Erro ao enviar. Tente novamente.')
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
        <WhatsAppButton label="Falar agora pelo WhatsApp" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      {/* honeypot — invisível para humanos, bots costumam preencher todo input */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />

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
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'TESTE GRÁTIS POR 7 DIAS'}
      </button>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium text-gray-400">ou</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <WhatsAppButton label="Falar pelo WhatsApp agora" />

      <p className="text-center text-xs text-gray-400">
        Sem cartão de crédito · Configuração em 1 dia útil · Cancele quando quiser
      </p>
    </form>
  )
}

function WhatsAppButton({ label }: { label: string }) {
  function handleClick() {
    fireConversion(GAD_WA_CONVERSION_LABEL)
    window.open(`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-[#25D366] px-8 py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
    >
      <WhatsAppIcon />
      {label}
    </button>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
