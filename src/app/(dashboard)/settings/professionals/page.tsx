'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronDown, ChevronUp, X, Power } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth.store'
import type { Professional, ProfessionalAvailability, Service } from '@/types'

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

type AvailabilityDraftRow = { weekday: number; startTime: string; endTime: string }

export default function ProfessionalsPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isManager = user?.role === 'owner' || user?.role === 'admin'

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSpecialty, setNewSpecialty] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: professionals = [], isLoading } = useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: () => api.get('/professionals').then((r) => r.data),
  })

  const { data: allServices = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then((r) => r.data),
  })

  const { data: detail } = useQuery<Professional>({
    queryKey: ['professionals', expandedId],
    queryFn: () => api.get(`/professionals/${expandedId}`).then((r) => r.data),
    enabled: !!expandedId,
  })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['professionals'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; specialty?: string }) => api.post('/professionals', payload),
    onSuccess: () => {
      invalidateAll()
      setShowForm(false)
      setNewName('')
      setNewSpecialty('')
      toast({ title: 'Profissional criado', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao criar profissional', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/professionals/${id}`, { isActive }),
    onSuccess: invalidateAll,
    onError: (err: any) => toast({ title: 'Erro ao atualizar profissional', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/professionals/${id}`),
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Profissional removido', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao remover profissional', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const addServiceMutation = useMutation({
    mutationFn: ({ professionalId, serviceId }: { professionalId: string; serviceId: string }) =>
      api.post(`/professionals/${professionalId}/services`, { serviceId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['professionals', expandedId] }),
    onError: (err: any) => toast({ title: 'Erro ao adicionar serviço', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const removeServiceMutation = useMutation({
    mutationFn: ({ professionalId, serviceId }: { professionalId: string; serviceId: string }) =>
      api.delete(`/professionals/${professionalId}/services/${serviceId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['professionals', expandedId] }),
    onError: (err: any) => toast({ title: 'Erro ao remover serviço', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const setAvailabilityMutation = useMutation({
    mutationFn: ({ professionalId, slots }: { professionalId: string; slots: AvailabilityDraftRow[] }) =>
      api.put(`/professionals/${professionalId}/availability`, { slots }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professionals', expandedId] })
      toast({ title: 'Disponibilidade salva', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao salvar disponibilidade', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const addTimeOffMutation = useMutation({
    mutationFn: ({ professionalId, payload }: { professionalId: string; payload: { date: string; startTime?: string; endTime?: string; reason?: string } }) =>
      api.post(`/professionals/${professionalId}/time-off`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professionals', expandedId] })
      toast({ title: 'Bloqueio adicionado', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao adicionar bloqueio', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const removeTimeOffMutation = useMutation({
    mutationFn: ({ professionalId, timeOffId }: { professionalId: string; timeOffId: string }) =>
      api.delete(`/professionals/${professionalId}/time-off/${timeOffId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['professionals', expandedId] }),
    onError: (err: any) => toast({ title: 'Erro ao remover bloqueio', description: err.response?.data?.message, variant: 'destructive' }),
  })

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-teal-900">Profissionais</h1>
          <p className="text-sm text-muted-foreground">Quem presta os serviços — dias, horários e bloqueios usados pelo agendamento</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo profissional</span>
          </Button>
        )}
      </div>

      {showForm && isManager && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Novo profissional</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (newName.trim()) createMutation.mutate({ name: newName.trim(), specialty: newSpecialty.trim() || undefined })
              }}
              className="flex flex-wrap gap-3"
            >
              <Input
                placeholder="Ex: Dra. Fernanda"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 min-w-[160px]"
                required
              />
              <Input
                placeholder="Especialidade (opcional)"
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                className="flex-1 min-w-[160px]"
              />
              <Button type="submit" disabled={createMutation.isPending}>Criar</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground">Carregando...</p>}
        {!isLoading && professionals.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum profissional cadastrado ainda.</p>
        )}
        {professionals.map((prof) => {
          const expanded = expandedId === prof.id
          return (
            <Card key={prof.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <button
                    className="flex flex-1 items-center gap-3 text-left"
                    onClick={() => setExpandedId(expanded ? null : prof.id)}
                  >
                    {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${prof.isActive ? 'text-gray-900' : 'text-muted-foreground line-through'}`}>{prof.name}</p>
                        <Badge variant={prof.isActive ? 'success' : 'secondary'}>{prof.isActive ? 'Ativo' : 'Inativo'}</Badge>
                      </div>
                      {prof.specialty && <p className="text-xs text-muted-foreground">{prof.specialty}</p>}
                    </div>
                  </button>
                  {isManager && (
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                        onClick={() => toggleMutation.mutate({ id: prof.id, isActive: !prof.isActive })}
                      >
                        <Power className="h-3 w-3" />
                        {prof.isActive ? 'Inativar' : 'Reativar'}
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => deleteMutation.mutate(prof.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>

                {expanded && detail && (
                  <div className="mt-4 space-y-6 border-t pt-4">
                    <ServicesSection
                      professional={detail}
                      allServices={allServices}
                      isManager={isManager}
                      onAdd={(serviceId) => addServiceMutation.mutate({ professionalId: prof.id, serviceId })}
                      onRemove={(serviceId) => removeServiceMutation.mutate({ professionalId: prof.id, serviceId })}
                    />
                    <AvailabilitySection
                      key={`avail-${prof.id}-${detail.availability?.length ?? 0}`}
                      professional={detail}
                      isManager={isManager}
                      saving={setAvailabilityMutation.isPending}
                      onSave={(slots) => setAvailabilityMutation.mutate({ professionalId: prof.id, slots })}
                    />
                    <TimeOffSection
                      professional={detail}
                      isManager={isManager}
                      adding={addTimeOffMutation.isPending}
                      onAdd={(payload) => addTimeOffMutation.mutate({ professionalId: prof.id, payload })}
                      onRemove={(timeOffId) => removeTimeOffMutation.mutate({ professionalId: prof.id, timeOffId })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ServicesSection({
  professional,
  allServices,
  isManager,
  onAdd,
  onRemove,
}: {
  professional: Professional
  allServices: Service[]
  isManager: boolean
  onAdd: (serviceId: string) => void
  onRemove: (serviceId: string) => void
}) {
  const attached = professional.services ?? []
  const attachedIds = new Set(attached.map((s) => s.id))
  const available = allServices.filter((s) => !attachedIds.has(s.id))

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">Serviços prestados</p>
      <div className="space-y-2">
        {attached.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <span className="truncate text-sm text-gray-800">{s.name} <span className="text-xs text-muted-foreground">({s.durationMinutes} min)</span></span>
            {isManager && (
              <button className="text-gray-400 hover:text-red-600" onClick={() => onRemove(s.id)}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {attached.length === 0 && <p className="text-xs text-muted-foreground">Nenhum serviço vinculado ainda.</p>}
      </div>
      {isManager && available.length > 0 && (
        <Select onValueChange={(serviceId) => onAdd(serviceId)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Adicionar serviço..." />
          </SelectTrigger>
          <SelectContent>
            {available.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

function AvailabilitySection({
  professional,
  isManager,
  saving,
  onSave,
}: {
  professional: Professional
  isManager: boolean
  saving: boolean
  onSave: (slots: AvailabilityDraftRow[]) => void
}) {
  const [rows, setRows] = useState<AvailabilityDraftRow[]>(
    (professional.availability ?? []).map((a) => ({ weekday: a.weekday, startTime: a.startTime.slice(0, 5), endTime: a.endTime.slice(0, 5) })),
  )

  function addRow() {
    setRows((prev) => [...prev, { weekday: 1, startTime: '09:00', endTime: '18:00' }])
  }

  function updateRow(index: number, patch: Partial<AvailabilityDraftRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">Disponibilidade semanal</p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={row.weekday}
              disabled={!isManager}
              onChange={(e) => updateRow(i, { weekday: parseInt(e.target.value, 10) })}
            >
              {WEEKDAY_LABELS.map((label, weekday) => (
                <option key={weekday} value={weekday}>{label}</option>
              ))}
            </select>
            <input
              type="time"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={row.startTime}
              disabled={!isManager}
              onChange={(e) => updateRow(i, { startTime: e.target.value })}
            />
            <span className="text-xs text-muted-foreground">até</span>
            <input
              type="time"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={row.endTime}
              disabled={!isManager}
              onChange={(e) => updateRow(i, { endTime: e.target.value })}
            />
            {isManager && (
              <button className="ml-auto text-gray-400 hover:text-red-600" onClick={() => removeRow(i)}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs text-muted-foreground">Nenhum horário cadastrado — profissional não aparece como disponível.</p>}
      </div>
      {isManager && (
        <div className="mt-2 flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={addRow} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Adicionar horário
          </Button>
          <Button type="button" size="sm" disabled={saving} onClick={() => onSave(rows)}>
            {saving ? 'Salvando...' : 'Salvar disponibilidade'}
          </Button>
        </div>
      )}
    </div>
  )
}

function TimeOffSection({
  professional,
  isManager,
  adding,
  onAdd,
  onRemove,
}: {
  professional: Professional
  isManager: boolean
  adding: boolean
  onAdd: (payload: { date: string; startTime?: string; endTime?: string; reason?: string }) => void
  onRemove: (timeOffId: string) => void
}) {
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [reason, setReason] = useState('')
  const timeOffs = professional.timeOff ?? []

  function submit() {
    if (!date) return
    onAdd({ date, startTime: startTime || undefined, endTime: endTime || undefined, reason: reason.trim() || undefined })
    setDate('')
    setStartTime('')
    setEndTime('')
    setReason('')
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">Bloqueios (férias, feriado, atestado...)</p>
      <div className="space-y-2">
        {timeOffs.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <span className="truncate text-sm text-gray-800">
              {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
              {t.startTime && t.endTime ? ` · ${t.startTime.slice(0, 5)}–${t.endTime.slice(0, 5)}` : ' · dia inteiro'}
              {t.reason ? ` · ${t.reason}` : ''}
            </span>
            {isManager && (
              <button className="text-gray-400 hover:text-red-600" onClick={() => onRemove(t.id)}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {timeOffs.length === 0 && <p className="text-xs text-muted-foreground">Nenhum bloqueio cadastrado.</p>}
      </div>
      {isManager && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="date"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="time"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            placeholder="Início (opcional)"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">até</span>
          <input
            type="time"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            placeholder="Fim (opcional)"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
          <Input
            placeholder="Motivo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-44"
          />
          <Button type="button" size="sm" disabled={adding || !date} onClick={submit}>Adicionar bloqueio</Button>
        </div>
      )}
      <p className="mt-1 text-xs text-muted-foreground">Sem horário = bloqueia o dia inteiro.</p>
    </div>
  )
}
