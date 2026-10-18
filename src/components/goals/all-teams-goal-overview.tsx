import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AllTeamsProgressEntry } from '@/types'

export function AllTeamsGoalOverview({ teams }: { teams: AllTeamsProgressEntry[] }) {
  const withGoals = teams.filter((t) => t.goals.length > 0)
  if (withGoals.length === 0) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Metas por equipe</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {withGoals.map((t) => (
          <Link
            key={t.teamId}
            href="/settings/teams"
            className="rounded-xl border-2 border-gray-200 p-4 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-gray-900">{t.teamName}</p>
              <span className="text-xs text-muted-foreground">{t.memberCount} membro(s)</span>
            </div>
            {t.leaderName && <p className="mb-3 text-xs text-muted-foreground">Líder: {t.leaderName}</p>}
            <div className="space-y-2">
              {t.goals.map((g) => (
                <div key={g.goalId}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-700">{g.metricLabel}</span>
                    <span className="text-muted-foreground">{g.current}/{g.target}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-teal-600" style={{ width: `${g.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
