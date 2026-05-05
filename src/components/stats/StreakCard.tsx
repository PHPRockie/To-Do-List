interface StreakCardProps {
  streak: number
  completionRate: number
}

export default function StreakCard({ streak, completionRate }: StreakCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="glass rounded-xl p-4 text-center">
        <p className="text-4xl font-bold gradient-text"><span aria-hidden="true">🔥 </span>{streak}</p>
        <p className="text-xs text-white/40 mt-1">Day streak</p>
      </div>
      <div className="glass rounded-xl p-4 text-center">
        <p className="text-4xl font-bold text-green-400">{completionRate}%</p>
        <p className="text-xs text-white/40 mt-1">This week</p>
      </div>
    </div>
  )
}
