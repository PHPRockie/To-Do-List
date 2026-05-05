import FocusTimer from '@/components/focus/FocusTimer'

export default function FocusPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <h1 className="text-xl font-semibold text-white/80 mb-2">Focus</h1>
      <p className="text-sm text-white/40 mb-8">Set a duration and start your session.</p>
      <FocusTimer />
    </div>
  )
}
