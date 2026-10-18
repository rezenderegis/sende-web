import type { GoalMetric, GoalPeriod, ProductivityGoal } from '@/types'

// Só os 2 fixos/automáticos — os demais ("Tarefa", "Reunião", "Visita
// presencial" e qualquer tipo customizado) são dinâmicos, vêm de /activity-types.
export const GOAL_METRIC_LABEL: Partial<Record<GoalMetric, string>> = {
  contacts_created: 'Contatos cadastrados',
  followup_messages: 'Mensagens de follow-up',
}

export const GOAL_PERIOD_LABEL: Record<GoalPeriod, string> = {
  day: 'por dia',
  week: 'por semana',
  month: 'por mês',
}

export const GOAL_PERIOD_OPTIONS: { value: GoalPeriod; label: string }[] = (
  Object.keys(GOAL_PERIOD_LABEL) as GoalPeriod[]
).map((value) => ({ value, label: GOAL_PERIOD_LABEL[value] }))

export function goalLabel(goal: Pick<ProductivityGoal, 'metric' | 'activityType'>): string {
  return GOAL_METRIC_LABEL[goal.metric] ?? goal.activityType?.name ?? '—'
}
