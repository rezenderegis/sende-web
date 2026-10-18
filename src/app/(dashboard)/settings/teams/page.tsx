'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronDown, ChevronUp, X, Sparkles, SlidersHorizontal, Power } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/store/auth.store'
import { GOAL_METRIC_LABEL, GOAL_PERIOD_OPTIONS, GOAL_PERIOD_LABEL, goalLabel } from '@/lib/goal-metrics'
import type { Team, User, ProductivityGoal, GoalMetric, GoalPeriod, ActivityType } from '@/types'

// Uma opção de métrica é OU um dos 2 fixos (activityTypeId undefined) OU um
// tipo de atividade dinâmico (metric sempre 'activity' + activityTypeId).
interface MetricOption {
  key: string
  metric: GoalMetric
  activityTypeId?: string
  label: string
}

function buildMetricOptions(activityTypes: ActivityType[]): MetricOption[] {
  const fixed: MetricOption[] = (Object.keys(GOAL_METRIC_LABEL) as GoalMetric[]).map((metric) => ({
    key: metric,
    metric,
    label: GOAL_METRIC_LABEL[metric]!,
  }))
  const dynamic: MetricOption[] = activityTypes
    .filter((t) => t.isActive)
    .map((t) => ({ key: t.id, metric: 'activity' as GoalMetric, activityTypeId: t.id, label: t.name }))
  return [...fixed, ...dynamic]
}

interface NewGoalForm {
  metricKey: string
  targetCount: string
  period: GoalPeriod
}

const EMPTY_GOAL_FORM: NewGoalForm = { metricKey: 'contacts_created', targetCount: '3', period: 'day' }

export default function TeamsAndGoalsPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isManager = user?.role === 'owner' || user?.role === 'admin'

  const [showTeamForm, setShowTeamForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null)
  const [goalFormTeamId, setGoalFormTeamId] = useState<string | null>(null)
  const [goalForm, setGoalForm] = useState<NewGoalForm>(EMPTY_GOAL_FORM)
  const [quotaGoal, setQuotaGoal] = useState<ProductivityGoal | null>(null)
  const [quotaValues, setQuotaValues] = useState<Record<string, string>>({})

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api.get('/teams').then((r) => r.data),
  })

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })

  const { data: goals = [] } = useQuery<ProductivityGoal[]>({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals').then((r) => r.data),
  })

  const { data: activityTypes = [] } = useQuery<ActivityType[]>({
    queryKey: ['activity-types'],
    queryFn: () => api.get('/activity-types').then((r) => r.data),
  })

  const metricOptions = useMemo(() => buildMetricOptions(activityTypes), [activityTypes])

  const [newActivityTypeName, setNewActivityTypeName] = useState('')

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['teams'] })
    qc.invalidateQueries({ queryKey: ['users'] })
    qc.invalidateQueries({ queryKey: ['goals'] })
    qc.invalidateQueries({ queryKey: ['goal-progress'] })
    qc.invalidateQueries({ queryKey: ['activity-types'] })
  }

  const createActivityTypeMutation = useMutation({
    mutationFn: (name: string) => api.post('/activity-types', { name }),
    onSuccess: () => {
      invalidateAll()
      setNewActivityTypeName('')
      toast({ title: 'Tipo de atividade criado', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao criar tipo de atividade', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const toggleActivityTypeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/activity-types/${id}`, { isActive }),
    onSuccess: invalidateAll,
    onError: (err: any) => toast({ title: 'Erro ao atualizar tipo de atividade', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const deleteActivityTypeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/activity-types/${id}`),
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Tipo de atividade removido', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Não foi possível excluir', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const createTeamMutation = useMutation({
    mutationFn: (name: string) => api.post('/teams', { name }),
    onSuccess: () => {
      invalidateAll()
      setShowTeamForm(false)
      setNewTeamName('')
      toast({ title: 'Equipe criada', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao criar equipe', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/teams/${id}`),
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Equipe removida', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao remover equipe', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.post(`/teams/${teamId}/members`, { userId }),
    onSuccess: invalidateAll,
    onError: (err: any) => toast({ title: 'Erro ao adicionar membro', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.delete(`/teams/${teamId}/members/${userId}`),
    onSuccess: invalidateAll,
    onError: (err: any) => toast({ title: 'Erro ao remover membro', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const setLeaderMutation = useMutation({
    mutationFn: ({ teamId, leaderId }: { teamId: string; leaderId: string }) =>
      api.patch(`/teams/${teamId}/leader`, { leaderId }),
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Líder definido', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao definir líder', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const createGoalMutation = useMutation({
    mutationFn: (data: { scope: 'team' | 'user'; teamId?: string; userId?: string; metric: GoalMetric; activityTypeId?: string; targetCount: number; period: GoalPeriod }) =>
      api.post('/goals', data),
    onSuccess: () => {
      invalidateAll()
      setGoalFormTeamId(null)
      setGoalForm(EMPTY_GOAL_FORM)
      toast({ title: 'Meta criada', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao criar meta', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: invalidateAll,
    onError: (err: any) => toast({ title: 'Erro ao remover meta', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const setQuotasMutation = useMutation({
    mutationFn: ({ goalId, quotas }: { goalId: string; quotas: { userId: string; quota: number }[] }) =>
      api.put(`/goals/${goalId}/quotas`, { quotas }),
    onSuccess: () => {
      invalidateAll()
      setQuotaGoal(null)
      toast({ title: 'Cotas atualizadas', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao salvar cotas', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const clearQuotasMutation = useMutation({
    mutationFn: (goalId: string) => api.delete(`/goals/${goalId}/quotas`),
    onSuccess: () => {
      invalidateAll()
      setQuotaGoal(null)
      toast({ title: 'Cotas resetadas para divisão igual', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao resetar cotas', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const applyTemplateMutation = useMutation({
    mutationFn: () => api.post('/goals/templates/receita-previsivel'),
    onSuccess: (res: any) => {
      invalidateAll()
      const { created, skipped } = res.data
      toast({ title: `Modelo aplicado: ${created} meta(s) criada(s), ${skipped} já existiam`, variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao aplicar modelo', description: err.response?.data?.message, variant: 'destructive' }),
  })

  function membersOf(teamId: string): User[] {
    return allUsers.filter((u) => u.teamId === teamId)
  }

  function goalsOf(scope: 'team' | 'user', id: string): ProductivityGoal[] {
    return goals.filter((g) => g.scope === scope && (scope === 'team' ? g.teamId === id : g.userId === id))
  }

  function canManageTeam(team: Team): boolean {
    return isManager || team.leaderId === user?.id
  }

  function openQuotaEditor(goal: ProductivityGoal, team: Team) {
    const members = membersOf(team.id)
    const n = members.length || 1
    const base = Math.floor(goal.targetCount / n)
    const remainder = goal.targetCount % n
    const initial: Record<string, string> = {}
    members.forEach((m, idx) => {
      initial[m.id] = String(base + (idx < remainder ? 1 : 0))
    })
    setQuotaValues(initial)
    setQuotaGoal(goal)
  }

  const quotaSum = Object.values(quotaValues).reduce((s, v) => s + (Number(v) || 0), 0)

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {quotaGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl p-6">
            <h2 className="font-semibold text-teal-900 mb-1">Ajustar cota por membro</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {goalLabel(quotaGoal)} — meta da equipe: {quotaGoal.targetCount} ({GOAL_PERIOD_LABEL[quotaGoal.period]})
            </p>
            <div className="space-y-3">
              {membersOf(quotaGoal.teamId!).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3">
                  <Label className="flex-1 truncate">{m.name}</Label>
                  <Input
                    type="number"
                    min={0}
                    className="w-20"
                    value={quotaValues[m.id] ?? '0'}
                    onChange={(e) => setQuotaValues((q) => ({ ...q, [m.id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <p className={`mt-4 text-sm font-medium ${quotaSum === quotaGoal.targetCount ? 'text-teal-700' : 'text-red-600'}`}>
              Soma: {quotaSum} / meta: {quotaGoal.targetCount}
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setQuotaGoal(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={quotaSum !== quotaGoal.targetCount || setQuotasMutation.isPending}
                onClick={() => setQuotasMutation.mutate({
                  goalId: quotaGoal.id,
                  quotas: Object.entries(quotaValues).map(([userId, quota]) => ({ userId, quota: Number(quota) || 0 })),
                })}
              >
                Salvar
              </Button>
            </div>
            <button
              className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-gray-700"
              onClick={() => clearQuotasMutation.mutate(quotaGoal.id)}
              disabled={clearQuotasMutation.isPending}
            >
              Restaurar divisão igual entre os membros
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-teal-900">Equipes e Metas</h1>
          <p className="text-sm text-muted-foreground">Metas de produtividade por pessoa ou por equipe</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowTeamForm(!showTeamForm)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova equipe</span>
          </Button>
        )}
      </div>

      {isManager && (
        <Card className="mb-6 border-teal-200 bg-teal-50/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <div>
                <p className="text-sm font-medium text-teal-900">Modelo "Receita Previsível"</p>
                <p className="text-xs text-muted-foreground">3 contatos cadastrados + 3 mensagens de follow-up por dia, por pessoa</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={applyTemplateMutation.isPending}
              onClick={() => applyTemplateMutation.mutate()}
            >
              {applyTemplateMutation.isPending ? 'Aplicando...' : 'Aplicar a todos'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tipos de atividade</CardTitle>
          <p className="text-sm text-muted-foreground">Usados nas metas de "Tarefa"/"Reunião"/etc — crie novos conforme precisar</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activityTypes.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`truncate text-sm ${t.isActive ? 'text-gray-800' : 'text-muted-foreground line-through'}`}>{t.name}</span>
                  <Badge variant={t.isActive ? 'success' : 'secondary'}>{t.isActive ? 'Ativo' : 'Inativo'}</Badge>
                </div>
                {isManager && (
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                      onClick={() => toggleActivityTypeMutation.mutate({ id: t.id, isActive: !t.isActive })}
                    >
                      <Power className="h-3 w-3" />
                      {t.isActive ? 'Inativar' : 'Reativar'}
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-600"
                      title="Só é possível excluir se não estiver em uso — senão, inative"
                      onClick={() => deleteActivityTypeMutation.mutate(t.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {activityTypes.length === 0 && <p className="text-xs text-muted-foreground">Nenhum tipo de atividade ainda.</p>}
          </div>
          {isManager && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (newActivityTypeName.trim()) createActivityTypeMutation.mutate(newActivityTypeName.trim())
              }}
              className="mt-3 flex gap-2"
            >
              <Input
                placeholder="Novo tipo de atividade (ex: Visita técnica)"
                value={newActivityTypeName}
                onChange={(e) => setNewActivityTypeName(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={createActivityTypeMutation.isPending}>Criar</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {showTeamForm && isManager && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nova equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (newTeamName.trim()) createTeamMutation.mutate(newTeamName.trim())
              }}
              className="flex gap-3"
            >
              <Input
                placeholder="Nome da equipe"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
              />
              <Button type="submit" disabled={createTeamMutation.isPending}>Criar</Button>
              <Button type="button" variant="outline" onClick={() => setShowTeamForm(false)}>Cancelar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground">Carregando...</p>}
        {!isLoading && teams.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma equipe criada ainda.</p>
        )}
        {teams.map((team) => {
          const members = membersOf(team.id)
          const usersWithoutTeam = allUsers.filter((u) => !u.teamId)
          const expanded = expandedTeamId === team.id
          const manage = canManageTeam(team)
          const teamGoals = goalsOf('team', team.id)

          return (
            <Card key={team.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <button
                    className="flex flex-1 items-center gap-3 text-left"
                    onClick={() => setExpandedTeamId(expanded ? null : team.id)}
                  >
                    {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    <div>
                      <p className="font-medium text-gray-900">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {members.length} membro(s)
                        {team.leaderId && ` · líder: ${allUsers.find((u) => u.id === team.leaderId)?.name ?? '—'}`}
                      </p>
                    </div>
                  </button>
                  {isManager && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-red-600 hover:bg-red-50"
                      onClick={() => deleteTeamMutation.mutate(team.id)}
                    >
                      Remover
                    </Button>
                  )}
                </div>

                {expanded && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">Membros</p>
                      <div className="space-y-2">
                        {members.map((m) => (
                          <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate text-sm text-gray-800">{m.name}</span>
                              {team.leaderId === m.id && <Badge>Líder</Badge>}
                            </div>
                            {isManager && (
                              <div className="flex shrink-0 items-center gap-2">
                                {team.leaderId !== m.id && (
                                  <button
                                    className="text-xs text-teal-600 hover:text-teal-700"
                                    onClick={() => setLeaderMutation.mutate({ teamId: team.id, leaderId: m.id })}
                                  >
                                    Definir líder
                                  </button>
                                )}
                                <button
                                  className="text-gray-400 hover:text-red-600"
                                  onClick={() => removeMemberMutation.mutate({ teamId: team.id, userId: m.id })}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        {members.length === 0 && <p className="text-xs text-muted-foreground">Nenhum membro ainda.</p>}
                      </div>
                      {manage && usersWithoutTeam.length > 0 && (
                        <Select onValueChange={(userId) => addMemberMutation.mutate({ teamId: team.id, userId })}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Adicionar membro..." />
                          </SelectTrigger>
                          <SelectContent>
                            {usersWithoutTeam.map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">Metas da equipe</p>
                      <div className="space-y-2">
                        {teamGoals.map((g) => (
                          <div key={g.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                            <div className="text-sm text-gray-800">
                              {goalLabel(g)} — {g.targetCount} {GOAL_PERIOD_LABEL[g.period]}
                            </div>
                            {manage && (
                              <div className="flex shrink-0 items-center gap-3">
                                <button
                                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                                  onClick={() => openQuotaEditor(g, team)}
                                >
                                  <SlidersHorizontal className="h-3 w-3" />
                                  Cota por membro
                                </button>
                                <button className="text-gray-400 hover:text-red-600" onClick={() => deleteGoalMutation.mutate(g.id)}>
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        {teamGoals.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma meta de equipe ainda.</p>}
                      </div>

                      {manage && (
                        goalFormTeamId === team.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              const option = metricOptions.find((o) => o.key === goalForm.metricKey)
                              if (!option) return
                              createGoalMutation.mutate({
                                scope: 'team',
                                teamId: team.id,
                                metric: option.metric,
                                activityTypeId: option.activityTypeId,
                                targetCount: Number(goalForm.targetCount),
                                period: goalForm.period,
                              })
                            }}
                            className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border p-3"
                          >
                            <Select value={goalForm.metricKey} onValueChange={(v) => setGoalForm((f) => ({ ...f, metricKey: v }))}>
                              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {metricOptions.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min={1}
                              className="w-20"
                              value={goalForm.targetCount}
                              onChange={(e) => setGoalForm((f) => ({ ...f, targetCount: e.target.value }))}
                              required
                            />
                            <Select value={goalForm.period} onValueChange={(v) => setGoalForm((f) => ({ ...f, period: v as GoalPeriod }))}>
                              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {GOAL_PERIOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Button type="submit" size="sm" disabled={createGoalMutation.isPending}>Criar</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setGoalFormTeamId(null)}>Cancelar</Button>
                          </form>
                        ) : (
                          <button
                            className="mt-2 text-xs font-medium text-teal-600 hover:text-teal-700"
                            onClick={() => { setGoalFormTeamId(team.id); setGoalForm(EMPTY_GOAL_FORM) }}
                          >
                            + Nova meta de equipe
                          </button>
                        )
                      )}
                    </div>

                    {members.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">Metas individuais</p>
                        <div className="space-y-3">
                          {members.map((m) => {
                            const memberGoals = goalsOf('user', m.id)
                            return (
                              <div key={m.id} className="rounded-lg bg-gray-50 px-3 py-2">
                                <p className="mb-1 text-xs font-medium text-gray-700">{m.name}</p>
                                {memberGoals.length === 0 && <p className="text-xs text-muted-foreground">Sem metas pessoais.</p>}
                                {memberGoals.map((g) => (
                                  <div key={g.id} className="flex items-center justify-between gap-2 py-0.5">
                                    <span className="text-xs text-gray-700">
                                      {goalLabel(g)} — {g.targetCount} {GOAL_PERIOD_LABEL[g.period]}
                                    </span>
                                    {manage && (
                                      <button className="text-gray-400 hover:text-red-600" onClick={() => deleteGoalMutation.mutate(g.id)}>
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {manage && (
                                  <PersonalGoalForm
                                    metricOptions={metricOptions}
                                    onCreate={(data) => createGoalMutation.mutate({ scope: 'user', userId: m.id, ...data })}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
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

function PersonalGoalForm({
  metricOptions,
  onCreate,
}: {
  metricOptions: MetricOption[]
  onCreate: (data: { metric: GoalMetric; activityTypeId?: string; targetCount: number; period: GoalPeriod }) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<NewGoalForm>(EMPTY_GOAL_FORM)

  if (!open) {
    return (
      <button className="mt-1 text-xs font-medium text-teal-600 hover:text-teal-700" onClick={() => setOpen(true)}>
        + Nova meta individual
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const option = metricOptions.find((o) => o.key === form.metricKey)
        if (!option) return
        onCreate({ metric: option.metric, activityTypeId: option.activityTypeId, targetCount: Number(form.targetCount), period: form.period })
        setOpen(false)
        setForm(EMPTY_GOAL_FORM)
      }}
      className="mt-2 flex flex-wrap items-end gap-2"
    >
      <Select value={form.metricKey} onValueChange={(v) => setForm((f) => ({ ...f, metricKey: v }))}>
        <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {metricOptions.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={1}
        className="w-16 h-8 text-xs"
        value={form.targetCount}
        onChange={(e) => setForm((f) => ({ ...f, targetCount: e.target.value }))}
        required
      />
      <Select value={form.period} onValueChange={(v) => setForm((f) => ({ ...f, period: v as GoalPeriod }))}>
        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {GOAL_PERIOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" className="h-8 text-xs">Criar</Button>
      <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => setOpen(false)}>Cancelar</Button>
    </form>
  )
}
