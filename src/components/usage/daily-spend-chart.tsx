'use client'

import { useMemo, useState } from 'react'
import type { DailySpend } from '@/types'

const OUTBOUND_COLOR = '#0D9488' // teal-600
const BOT_COLOR = '#7C3AED' // violet-600

function centsToReais(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function niceMax(value: number): number {
  if (value <= 0) return 100 // R$1,00 em centavos, evita eixo vazio
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function DailySpendChart({ data }: { data: DailySpend[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  const maxCents = useMemo(() => niceMax(Math.max(...data.map((d) => d.totalCostCents), 0)), [data])

  const width = 720
  const height = 200
  const paddingLeft = 44
  const paddingBottom = 20
  const chartWidth = width - paddingLeft
  const chartHeight = height - paddingBottom
  const gap = 3
  const barWidth = Math.min(24, chartWidth / data.length - gap)
  const stackGap = 2

  const scaleY = (cents: number) => (cents / maxCents) * chartHeight

  const gridLines = [0, 0.5, 1].map((f) => Math.round(maxCents * f))
  const labelEvery = Math.ceil(data.length / 6)

  return (
    <div className="relative">
      {/* legenda */}
      <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: OUTBOUND_COLOR }} />
          Saída
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BOT_COLOR }} />
          Bot
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ overflow: 'visible' }}>
        {/* gridlines + labels do eixo Y */}
        {gridLines.map((val) => {
          const y = chartHeight - scaleY(val)
          return (
            <g key={val}>
              <line x1={paddingLeft} y1={y} x2={width} y2={y} stroke="#E5E7EB" strokeWidth={1} />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fontSize={10} fill="#94A3B8">
                {val === 0 ? 'R$0' : `R$${(val / 100).toFixed(0)}`}
              </text>
            </g>
          )
        })}

        {/* barras */}
        {data.map((d, i) => {
          const x = paddingLeft + i * (barWidth + gap)
          const outboundH = scaleY(d.outboundCostCents)
          const botH = scaleY(d.botCostCents)
          const hasBoth = d.outboundCostCents > 0 && d.botCostCents > 0
          const topRadius = 4

          return (
            <g
              key={d.date}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* hit area maior que a barra visual */}
              <rect x={x - 1} y={0} width={barWidth + 2} height={chartHeight} fill="transparent" />

              {/* segmento saída (base) */}
              {d.outboundCostCents > 0 && (
                <rect
                  x={x}
                  y={chartHeight - outboundH}
                  width={barWidth}
                  height={outboundH}
                  fill={OUTBOUND_COLOR}
                  opacity={hovered === null || hovered === i ? 1 : 0.35}
                  rx={hasBoth ? 0 : topRadius}
                  ry={hasBoth ? 0 : topRadius}
                />
              )}

              {/* segmento bot (topo) */}
              {d.botCostCents > 0 && (
                <rect
                  x={x}
                  y={chartHeight - outboundH - (hasBoth ? stackGap : 0) - botH}
                  width={barWidth}
                  height={botH}
                  fill={BOT_COLOR}
                  opacity={hovered === null || hovered === i ? 1 : 0.35}
                  rx={topRadius}
                  ry={topRadius}
                />
              )}

              {/* label do eixo X (esparso) */}
              {i % labelEvery === 0 && (
                <text x={x + barWidth / 2} y={chartHeight + 14} textAnchor="middle" fontSize={9} fill="#94A3B8">
                  {formatShortDate(d.date)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {hovered !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${((paddingLeft + hovered * (barWidth + gap) + barWidth / 2) / width) * 100}%`,
            top: 0,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="mb-1 font-semibold text-gray-800">{formatShortDate(data[hovered].date)}</p>
          <p className="flex items-center gap-1.5 text-gray-600">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: OUTBOUND_COLOR }} />
            Saída: <span className="font-medium text-gray-900">R$ {centsToReais(data[hovered].outboundCostCents)}</span>
          </p>
          <p className="flex items-center gap-1.5 text-gray-600">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: BOT_COLOR }} />
            Bot: <span className="font-medium text-gray-900">R$ {centsToReais(data[hovered].botCostCents)}</span>
          </p>
          <p className="mt-1 border-t pt-1 font-semibold text-gray-900">
            Total: R$ {centsToReais(data[hovered].totalCostCents)}
          </p>
        </div>
      )}
    </div>
  )
}
