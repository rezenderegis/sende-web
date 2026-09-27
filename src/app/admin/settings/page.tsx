'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import type { PlatformSettings } from '@/types'

function centsToReais(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

function reaisToCents(value: string): number {
  const normalized = value.replace(',', '.')
  const n = parseFloat(normalized)
  return Math.round((isNaN(n) ? 0 : n) * 100)
}

const FIELDS: { key: keyof PlatformSettings; label: string; hint: string; placeholder: string }[] = [
  { key: 'costPerFreeTextMessageCents', label: 'Texto livre (agente)', hint: 'Resposta manual dentro da janela de 24h — normalmente grátis na Meta', placeholder: '0,00' },
  { key: 'costPerBotMessageCents', label: 'Resposta do bot', hint: 'Resposta automática da IA', placeholder: '0,03' },
  { key: 'costPerMarketingMessageCents', label: 'Template — Marketing', hint: 'Template categoria MARKETING', placeholder: '0,08' },
  { key: 'costPerUtilityMessageCents', label: 'Template — Utility', hint: 'Template categoria UTILITY', placeholder: '0,05' },
  { key: 'costPerAuthenticationMessageCents', label: 'Template — Authentication', hint: 'Template categoria AUTHENTICATION', placeholder: '0,03' },
  { key: 'costPerOutboundMessageCents', label: 'Fallback (categoria desconhecida)', hint: 'Usado quando o template ainda não foi sincronizado / categoria não identificada', placeholder: '0,05' },
]

const LIMIT_FIELDS: { key: keyof PlatformSettings; label: string; hint: string }[] = [
  { key: 'defaultDailySpendLimitCents', label: 'Limite diário padrão', hint: 'Vale pra todo número que não tiver um limite próprio definido' },
  { key: 'defaultMonthlySpendLimitCents', label: 'Limite mensal padrão', hint: 'Vale pra todo número que não tiver um limite próprio definido' },
]

export default function AdminSettingsPage() {
  const qc = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})

  const { data: settings } = useQuery<PlatformSettings>({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then((r) => r.data),
  })

  useEffect(() => {
    if (settings) {
      setValues({
        ...Object.fromEntries(FIELDS.map((f) => [f.key, centsToReais(settings[f.key] as number)])),
        ...Object.fromEntries(
          LIMIT_FIELDS.map((f) => [f.key, settings[f.key] != null ? centsToReais(settings[f.key] as number) : '']),
        ),
      })
    }
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch('/admin/settings', {
        ...Object.fromEntries(FIELDS.map((f) => [f.key, reaisToCents(values[f.key] ?? '0,00')])),
        ...Object.fromEntries(
          LIMIT_FIELDS.map((f) => [f.key, values[f.key]?.trim() ? reaisToCents(values[f.key]) : null]),
        ),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      toast({ title: 'Configurações atualizadas', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao salvar', variant: 'destructive' }),
  })

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-1 text-xl font-semibold text-teal-900">Taxa por mensagem</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Valores fixos usados pra calcular o gasto de cada empresa, por tipo de mensagem. Se mudar aqui, mensagens já enviadas mantêm o custo gravado na hora do envio.
      </p>

      <div className="space-y-4 rounded-lg border bg-white p-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium text-gray-700">{f.label} (R$)</label>
            <p className="mb-1.5 text-[11px] text-muted-foreground">{f.hint}</p>
            <Input
              value={values[f.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>

      <h1 className="mb-1 mt-8 text-xl font-semibold text-teal-900">Guardrail de gasto</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Proteção sua contra gasto excessivo — não é visível pro cliente. Se um número não tiver limite próprio configurado, esses valores valem como padrão e bloqueiam o envio quando estourados, além de te avisar (1x por dia por número).
      </p>

      <div className="space-y-4 rounded-lg border bg-white p-5">
        {LIMIT_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium text-gray-700">{f.label} (R$)</label>
            <p className="mb-1.5 text-[11px] text-muted-foreground">{f.hint}</p>
            <Input
              value={values[f.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder="Sem limite"
            />
          </div>
        ))}

        <Button
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
