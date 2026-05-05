const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface WeekChartProps {
  data: number[]
}

export default function WeekChart({ data }: WeekChartProps) {
  const max = Math.max(...data, 1)
  const total = data.reduce((a, b) => a + b, 0)

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-white/40 uppercase tracking-wider">Tasks completed</p>
        <p className="text-sm font-semibold text-white/70">{total}</p>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full rounded-sm"
              style={{
                height: `${(count / max) * 52}px`,
                background: count === 0 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(to top, #7c3aed, #ec4899)',
                minHeight: '3px',
              }}
            />
            <span className="text-xs text-white/30">{DAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
