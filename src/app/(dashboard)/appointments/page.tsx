'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, X, Search, CalendarClock } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { cn, formatPhone } from '@/lib/utils'
import type { Appointment, AppointmentStatus, AvailableSlot, Contact, Professional, Service } from '@/types'

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const SLOT_STEP = 30

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToLabel(m: number): string {
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDaysToKey(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDateKeyLabel(key: string): string {
  const d = new Date(`${key}T00:00:00.000Z`)
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' })
}

function formatTimeUTC(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

function formatDateTimeUTC(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) + ` · ${formatTimeUTC(iso)}`
}

function minutesOfDayUTC(iso: string): number {
  const d = new Date(iso)
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

function isoFromDateKeyAndMinutes(dateKey: string, minutes: number): string {
  return `${dateKey}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00.000Z`
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
}

const STATUS_VARIANT: Record<AppointmentStatus, 'success' | 'secondary' | 'destructive' | 'warning'> = {
  scheduled: 'success',
  completed: 'done' as any,
  cancelled: 'secondary',
  no_show: 'warning',
}

export default function AppointmentsPage() {
  const qc = useQueryClient()
  const [view, setView] = useState<'day' | 'list'>('day')
  const [dateKey, setDateKey] = useState(todayKey())
  const [creating, setCreating] = useState<{ professionalId?: string; startAt?: string } | null>(null)
  const [actionAppointment, setActionAppointment] = useState<Appointment | null>(null)
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null)

  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: () => api.get('/professionals').then((r) => r.data),
  })
  const activeProfessionals = useMemo(() => professionals.filter((p) => p.isActive), [professionals])

  const detailQueries = useQueries({
    queries: activeProfessionals.map((p) => ({
      queryKey: ['professionals', p.id],
      queryFn: () => api.get(`/professionals/${p.id}`).then((r) => r.data as Professional),
      enabled: view === 'day',
    })),
  })

  const detailsByProfessionalId = useMemo(() => {
    const map = new Map<string, Professional>()
    activeProfessionals.forEach((p, i) => {
      const d = detailQueries[i]?.data
      if (d) map.set(p.id, d)
    })
    return map
  }, [activeProfessionals, detailQueries])

  const { data: dayAppointments = [], isLoading: loadingDay } = useQuery<Appointment[]>({
    queryKey: ['appointments', 'day', dateKey],
    queryFn: () =>
      api
        .get('/appointments', { params: { from: `${dateKey}T00:00:00.000Z`, to: `${addDaysToKey(dateKey, 1)}T00:00:00.000Z` } })
        .then((r) => r.data),
    enabled: view === 'day',
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      setActionAppointment(null)
      toast({ title: 'Agendamento cancelado', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao cancelar', description: err.response?.data?.message, variant: 'destructive' }),
  })

  function openEmptyCell(professionalId: string, startAt: string) {
    setCreating({ professionalId, startAt })
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-teal-900">Agendamentos</h1>
          <p className="text-sm text-muted-foreground">Agenda de atendimento por profissional</p>
        </div>
        <Button onClick={() => setCreating({})} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo agendamento</span>
        </Button>
      </div>

      <div className="mb-4 flex rounded-lg border bg-gray-50 p-1 w-fit">
        <button
          onClick={() => setView('day')}
          className={cn('rounded-md px-4 py-1.5 text-sm font-medium transition-colors', view === 'day' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        >
          Agenda do dia
        </button>
        <button
          onClick={() => setView('list')}
          className={cn('rounded-md px-4 py-1.5 text-sm font-medium transition-colors', view === 'list' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        >
          Lista
        </button>
      </div>

      {view === 'day' ? (
        <DayPanel
          dateKey={dateKey}
          setDateKey={setDateKey}
          professionals={activeProfessionals}
          detailsByProfessionalId={detailsByProfessionalId}
          appointments={dayAppointments}
          loading={loadingDay}
          onEmptyCellClick={openEmptyCell}
          onAppointmentClick={setActionAppointment}
        />
      ) : (
        <ListPanel professionals={professionals} onAppointmentClick={setActionAppointment} />
      )}

      {creating && (
        <AppointmentFormModal
          mode="create"
          initial={creating}
          onClose={() => setCreating(null)}
        />
      )}

      {rescheduling && (
        <AppointmentFormModal
          mode="reschedule"
          appointment={rescheduling}
          onClose={() => setRescheduling(null)}
        />
      )}

      {actionAppointment && (
        <AppointmentActionsModal
          appointment={actionAppointment}
          onClose={() => setActionAppointment(null)}
          onCancel={() => cancelMutation.mutate(actionAppointment.id)}
          cancelling={cancelMutation.isPending}
          onReschedule={() => {
            setRescheduling(actionAppointment)
            setActionAppointment(null)
          }}
        />
      )}
    </div>
  )
}

type CellPlan =
  | { type: 'blocked' }
  | { type: 'timeoff' }
  | { type: 'empty' }
  | { type: 'skip' }
  | { type: 'appt'; appt: Appointment; rowSpan: number }

function buildColumnPlan(detail: Professional | undefined, rows: number[], weekday: number, dateKey: string, appts: Appointment[]): CellPlan[] {
  const windows = (detail?.availability ?? []).filter((a) => a.weekday === weekday)
  const timeOffs = (detail?.timeOff ?? []).filter((t) => t.date === dateKey)
  const plan: CellPlan[] = rows.map((m) => {
    const inWindow = windows.some((w) => m >= timeToMinutes(w.startTime) && m < timeToMinutes(w.endTime))
    if (!inWindow) return { type: 'blocked' }
    const blocked = timeOffs.some((t) => {
      if (!t.startTime || !t.endTime) return true
      const start = timeToMinutes(t.startTime)
      const end = timeToMinutes(t.endTime)
      return m < end && start < m + SLOT_STEP
    })
    return blocked ? { type: 'timeoff' } : { type: 'empty' }
  })

  for (const appt of appts) {
    if (appt.status === 'cancelled') continue
    const startMin = minutesOfDayUTC(appt.scheduledAt)
    const startIdx = rows.indexOf(startMin)
    if (startIdx === -1) continue
    const spanRows = Math.max(1, Math.ceil(appt.durationMinutes / SLOT_STEP))
    plan[startIdx] = { type: 'appt', appt, rowSpan: spanRows }
    for (let k = 1; k < spanRows && startIdx + k < rows.length; k++) plan[startIdx + k] = { type: 'skip' }
  }
  return plan
}

function DayPanel({
  dateKey,
  setDateKey,
  professionals,
  detailsByProfessionalId,
  appointments,
  loading,
  onEmptyCellClick,
  onAppointmentClick,
}: {
  dateKey: string
  setDateKey: (k: string) => void
  professionals: Professional[]
  detailsByProfessionalId: Map<string, Professional>
  appointments: Appointment[]
  loading: boolean
  onEmptyCellClick: (professionalId: string, startAt: string) => void
  onAppointmentClick: (appt: Appointment) => void
}) {
  const weekday = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay()

  const { minStart, maxEnd } = useMemo(() => {
    let min = Infinity
    let max = -Infinity
    professionals.forEach((p) => {
      const detail = detailsByProfessionalId.get(p.id)
      ;(detail?.availability ?? []).filter((a) => a.weekday === weekday).forEach((w) => {
        min = Math.min(min, timeToMinutes(w.startTime))
        max = Math.max(max, timeToMinutes(w.endTime))
      })
    })
    if (!isFinite(min) || !isFinite(max)) return { minStart: 0, maxEnd: 0 }
    return { minStart: min, maxEnd: max }
  }, [professionals, detailsByProfessionalId, weekday])

  const rows: number[] = []
  for (let m = minStart; m < maxEnd; m += SLOT_STEP) rows.push(m)

  const appointmentsByProfessional = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    appointments.forEach((a) => {
      if (!a.professionalId) return
      const list = map.get(a.professionalId) ?? []
      list.push(a)
      map.set(a.professionalId, list)
    })
    return map
  }, [appointments])

  const columnPlans = useMemo(
    () => professionals.map((p) => buildColumnPlan(detailsByProfessionalId.get(p.id), rows, weekday, dateKey, appointmentsByProfessional.get(p.id) ?? [])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [professionals, detailsByProfessionalId, weekday, dateKey, appointmentsByProfessional, rows.length],
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => setDateKey(addDaysToKey(dateKey, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={() => setDateKey(addDaysToKey(dateKey, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDateKey(todayKey())}>Hoje</Button>
        <input
          type="date"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={dateKey}
          onChange={(e) => e.target.value && setDateKey(e.target.value)}
        />
        <span className="ml-1 text-sm font-medium capitalize text-gray-700">{formatDateKeyLabel(dateKey)}</span>
      </div>

      {professionals.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhum profissional ativo cadastrado. Cadastre em Configurações → Profissionais.</p>
      )}

      {professionals.length > 0 && rows.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhum profissional tem expediente em {WEEKDAY_LABELS[weekday].toLowerCase()}.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="w-20 shrink-0 border-r px-3 py-2 text-left text-xs font-semibold text-gray-500">Horário</th>
                {professionals.map((p) => (
                  <th key={p.id} className="min-w-[180px] border-r px-3 py-2 text-left text-xs font-semibold text-gray-700 last:border-r-0">
                    {p.name}
                    {p.specialty && <span className="ml-1 font-normal text-gray-400">· {p.specialty}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((m, rowIdx) => {
                const plans = columnPlans.map((colPlan) => colPlan[rowIdx])
                return (
                  <tr key={m} className="border-b last:border-b-0">
                    <td className="border-r px-3 py-2 text-xs font-medium text-gray-500">{minutesToLabel(m)}</td>
                    {professionals.map((p, colIdx) => {
                      const plan = plans[colIdx]
                      if (plan.type === 'skip') return null
                      if (plan.type === 'blocked') {
                        return <td key={p.id} className="border-r bg-gray-50 px-3 py-2 last:border-r-0" />
                      }
                      if (plan.type === 'timeoff') {
                        return <td key={p.id} className="border-r bg-amber-50 px-3 py-2 text-xs text-amber-700 last:border-r-0">Bloqueado</td>
                      }
                      if (plan.type === 'appt') {
                        const a = plan.appt
                        return (
                          <td
                            key={p.id}
                            rowSpan={plan.rowSpan}
                            className={cn(
                              'border-r cursor-pointer px-3 py-2 align-top last:border-r-0 transition-colors',
                              a.status === 'completed' ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-teal-50 hover:bg-teal-100',
                            )}
                            onClick={() => onAppointmentClick(a)}
                          >
                            <p className="truncate font-medium text-gray-900">{a.contact?.name ?? 'Contato'}</p>
                            <p className="truncate text-xs text-gray-500">{a.service?.name}</p>
                          </td>
                        )
                      }
                      return (
                        <td
                          key={p.id}
                          className="border-r cursor-pointer px-3 py-2 text-gray-300 last:border-r-0 hover:bg-teal-50/60 hover:text-teal-600"
                          onClick={() => onEmptyCellClick(p.id, isoFromDateKeyAndMinutes(dateKey, m))}
                        >
                          +
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {loading && <p className="mt-2 text-xs text-muted-foreground">Carregando agendamentos...</p>}
    </div>
  )
}

function ListPanel({ professionals, onAppointmentClick }: { professionals: Professional[]; onAppointmentClick: (a: Appointment) => void }) {
  const [professionalId, setProfessionalId] = useState<string>('')

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', 'list', professionalId],
    queryFn: () => api.get('/appointments', { params: professionalId ? { professionalId } : {} }).then((r) => r.data),
  })

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Select value={professionalId || 'all'} onValueChange={(v) => setProfessionalId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todos os profissionais" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os profissionais</SelectItem>
            {professionals.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Próximos agendamentos (não cancelados)</p>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {!isLoading && appointments.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhum agendamento futuro.</p>
      )}

      <div className="space-y-2">
        {appointments.map((a) => (
          <button
            key={a.id}
            onClick={() => onAppointmentClick(a)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 text-left hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{a.contact?.name ?? 'Contato'}</p>
              <p className="truncate text-xs text-muted-foreground">{a.service?.name} · {a.professional?.name ?? 'Sem profissional'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm text-gray-600">{formatDateTimeUTC(a.scheduledAt)}</span>
              <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function AppointmentActionsModal({
  appointment,
  onClose,
  onCancel,
  cancelling,
  onReschedule,
}: {
  appointment: Appointment
  onClose: () => void
  onCancel: () => void
  cancelling: boolean
  onReschedule: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-teal-900">Agendamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Contato:</span> {appointment.contact?.name} {appointment.contact?.phone && `(${formatPhone(appointment.contact.phone)})`}</p>
          <p><span className="text-muted-foreground">Serviço:</span> {appointment.service?.name}</p>
          <p><span className="text-muted-foreground">Profissional:</span> {appointment.professional?.name ?? '—'}</p>
          <p><span className="text-muted-foreground">Horário:</span> {formatDateTimeUTC(appointment.scheduledAt)}</p>
          <p><span className="text-muted-foreground">Status:</span> <Badge variant={STATUS_VARIANT[appointment.status]}>{STATUS_LABEL[appointment.status]}</Badge></p>
          {appointment.notes && <p><span className="text-muted-foreground">Notas:</span> {appointment.notes}</p>}
        </div>
        {appointment.status === 'scheduled' && (
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" className="text-red-600 hover:bg-red-50" disabled={cancelling} onClick={onCancel}>
              Cancelar agendamento
            </Button>
            <Button onClick={onReschedule}>Reagendar</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function AppointmentFormModal({
  mode,
  initial,
  appointment,
  onClose,
}: {
  mode: 'create' | 'reschedule'
  initial?: { professionalId?: string; startAt?: string }
  appointment?: Appointment
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [step, setStep] = useState<'contact' | 'service' | 'professional' | 'slot'>(mode === 'reschedule' ? 'professional' : 'contact')
  const [search, setSearch] = useState('')
  const [contactId, setContactId] = useState<string | undefined>(appointment?.contactId)
  const [contactLabel, setContactLabel] = useState<string>(appointment?.contact?.name ?? '')
  const [serviceId, setServiceId] = useState<string | undefined>(appointment?.serviceId ?? undefined)
  const [professionalId, setProfessionalId] = useState<string | undefined>(initial?.professionalId ?? appointment?.professionalId ?? undefined)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)

  const { data: allContacts = [] } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts').then((r) => r.data),
    enabled: step === 'contact',
  })

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return allContacts.slice(0, 30)
    const digits = term.replace(/\D/g, '')
    return allContacts.filter((c) => c.name?.toLowerCase().includes(term) || (digits.length > 0 && c.phone?.includes(digits))).slice(0, 30)
  }, [allContacts, search])

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then((r) => r.data),
  })
  const activeServices = services.filter((s) => s.isActive)

  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: () => api.get('/professionals').then((r) => r.data),
  })
  const eligibleProfessionals = professionals.filter((p) => p.isActive && (!serviceId || p.services?.some((s) => s.id === serviceId)))

  const searchFromKey = initial?.startAt ? initial.startAt.slice(0, 10) : todayKey()
  const { data: slots = [], isFetching: loadingSlots } = useQuery<AvailableSlot[]>({
    queryKey: ['available-slots', serviceId, professionalId, searchFromKey],
    queryFn: () =>
      api
        .get('/appointments/available-slots', {
          params: { serviceId, professionalId: professionalId || undefined, from: searchFromKey, to: addDaysToKey(searchFromKey, 14) },
        })
        .then((r) => r.data),
    enabled: step === 'slot' && !!serviceId,
  })

  const slotsByDate = useMemo(() => {
    const map = new Map<string, AvailableSlot[]>()
    slots.forEach((s) => {
      const key = s.startAt.slice(0, 10)
      const list = map.get(key) ?? []
      list.push(s)
      map.set(key, list)
    })
    return map
  }, [slots])

  const createMutation = useMutation({
    mutationFn: () => api.post('/appointments', { contactId, serviceId, professionalId: selectedSlot!.professionalId, scheduledAt: selectedSlot!.startAt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast({ title: 'Agendamento confirmado', variant: 'success' })
      onClose()
    },
    onError: (err: any) => {
      toast({ title: 'Não foi possível agendar', description: err.response?.data?.message, variant: 'destructive' })
      qc.invalidateQueries({ queryKey: ['available-slots'] })
      setSelectedSlot(null)
    },
  })

  const rescheduleMutation = useMutation({
    mutationFn: () => api.patch(`/appointments/${appointment!.id}/reschedule`, { professionalId: selectedSlot!.professionalId, scheduledAt: selectedSlot!.startAt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast({ title: 'Agendamento reagendado', variant: 'success' })
      onClose()
    },
    onError: (err: any) => {
      toast({ title: 'Não foi possível reagendar', description: err.response?.data?.message, variant: 'destructive' })
      qc.invalidateQueries({ queryKey: ['available-slots'] })
      setSelectedSlot(null)
    },
  })

  const confirming = createMutation.isPending || rescheduleMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-teal-900">{mode === 'create' ? 'Novo agendamento' : 'Reagendar'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {mode === 'reschedule' && appointment && (
          <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <p className="font-medium text-gray-800">{appointment.contact?.name}</p>
            <p className="text-xs text-muted-foreground">{appointment.service?.name} · atualmente {formatDateTimeUTC(appointment.scheduledAt)}</p>
          </div>
        )}

        {step === 'contact' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input className="pl-9" placeholder="Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border">
              {filteredContacts.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhum contato encontrado</p>}
              {filteredContacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setContactId(c.id)
                    setContactLabel(c.name)
                    setStep('service')
                  }}
                  className="flex w-full items-center justify-between gap-2 border-b px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-teal-50"
                >
                  <span>
                    <span className="block font-medium text-gray-900">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">{formatPhone(c.phone)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'service' && (
          <div className="space-y-2">
            <p className="mb-2 text-sm text-muted-foreground">Paciente/cliente: <span className="font-medium text-gray-800">{contactLabel}</span></p>
            {activeServices.length === 0 && <p className="text-sm text-muted-foreground">Nenhum serviço ativo cadastrado.</p>}
            {activeServices.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setServiceId(s.id)
                  setProfessionalId(initial?.professionalId)
                  setStep('professional')
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm hover:bg-teal-50"
              >
                <span className="font-medium text-gray-900">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.durationMinutes} min</span>
              </button>
            ))}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setStep('contact')}>Voltar</Button>
          </div>
        )}

        {step === 'professional' && (
          <div className="space-y-2">
            <button
              onClick={() => {
                setProfessionalId(undefined)
                setStep('slot')
              }}
              className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm hover:bg-teal-50"
            >
              <span className="font-medium text-gray-900">Sem preferência</span>
              <span className="text-xs text-muted-foreground">qualquer profissional disponível</span>
            </button>
            {eligibleProfessionals.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProfessionalId(p.id)
                  setStep('slot')
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm hover:bg-teal-50"
              >
                <span className="font-medium text-gray-900">{p.name}</span>
                {p.specialty && <span className="text-xs text-muted-foreground">{p.specialty}</span>}
              </button>
            ))}
            {mode === 'create' && (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setStep('service')}>Voltar</Button>
            )}
          </div>
        )}

        {step === 'slot' && (
          <div className="space-y-3">
            {loadingSlots && <p className="text-sm text-muted-foreground">Buscando horários...</p>}
            {!loadingSlots && slots.length === 0 && <p className="text-sm text-muted-foreground">Nenhum horário disponível nos próximos 14 dias.</p>}
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {Array.from(slotsByDate.entries()).map(([date, dateSlots]) => (
                <div key={date}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{formatDateKeyLabel(date)}</p>
                  <div className="flex flex-wrap gap-2">
                    {dateSlots.map((s) => (
                      <button
                        key={`${s.professionalId}-${s.startAt}`}
                        onClick={() => setSelectedSlot(s)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                          selectedSlot?.startAt === s.startAt && selectedSlot?.professionalId === s.professionalId
                            ? 'border-teal-600 bg-teal-50 text-teal-700'
                            : 'hover:bg-gray-50',
                        )}
                        title={!professionalId ? s.professionalName : undefined}
                      >
                        {formatTimeUTC(s.startAt)}
                        {!professionalId && <span className="ml-1 text-xs text-muted-foreground">· {s.professionalName}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('professional')}>Voltar</Button>
              <Button
                disabled={!selectedSlot || confirming}
                onClick={() => (mode === 'create' ? createMutation.mutate() : rescheduleMutation.mutate())}
              >
                {confirming ? 'Confirmando...' : 'Confirmar agendamento'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
