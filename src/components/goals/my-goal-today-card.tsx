import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { GoalProgressItem } from '@/types'

export function MyGoalTodayCard({ goals }: { goals: GoalProgressItem[] }) {
  if (goals.length === 0) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Minha meta de hoje</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {goals.map((g) => (
          <div key={g.goalId}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-800">{g.metricLabel}</span>
              <span className="text-xs text-muted-foreground">{g.current} de {g.target}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-teal-600 transition-all"
                style={{ width: `${g.percent}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
