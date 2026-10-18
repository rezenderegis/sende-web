import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TeamProgress } from '@/types'

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${percent}%` }} />
    </div>
  )
}

export function TeamGoalProgressCard({ team }: { team: TeamProgress }) {
  if (team.goals.length === 0) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Progresso da equipe — {team.teamName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {team.goals.map((g) => (
            <div key={g.goalId}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800">{g.metricLabel}</span>
                <span className="text-xs text-muted-foreground">{g.current} de {g.target}</span>
              </div>
              <ProgressBar percent={g.percent} />
            </div>
          ))}
        </div>

        {team.members.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            {team.members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                  {m.userName.charAt(0).toUpperCase()}
                </div>
                <p className="w-28 shrink-0 truncate text-sm text-gray-800">{m.userName}</p>
                <div className="flex-1 space-y-1.5">
                  {m.goals.map((g) => (
                    <div key={g.goalId} className="flex items-center gap-2">
                      <span className="w-10 shrink-0 text-right text-[11px] text-muted-foreground">
                        {g.current}/{g.target}
                      </span>
                      <ProgressBar percent={g.percent} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
