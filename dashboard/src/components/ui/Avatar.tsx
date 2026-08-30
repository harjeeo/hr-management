const COLORS = [
  'bg-rose-100 text-rose-600',
  'bg-amber-100 text-amber-600',
  'bg-emerald-100 text-emerald-600',
  'bg-sky-100 text-sky-600',
  'bg-violet-100 text-violet-600',
  'bg-pink-100 text-pink-600',
  'bg-indigo-100 text-indigo-600',
  'bg-teal-100 text-teal-600',
]

function colorFor(name: string) {
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return COLORS[hash % COLORS.length]
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center font-medium ${colorFor(name)}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initialsFor(name)}
    </div>
  )
}
