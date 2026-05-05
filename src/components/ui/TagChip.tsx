export default function TagChip({ tag }: { tag: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/10">
      {tag}
    </span>
  )
}
