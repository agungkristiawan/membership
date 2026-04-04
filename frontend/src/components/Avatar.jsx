const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
  'bg-violet-500', 'bg-teal-500', 'bg-orange-500', 'bg-sky-500',
]

function getColor(name) {
  if (!name) return AVATAR_COLORS[0]
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export default function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-20 h-20 text-2xl' }
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
  }

  return (
    <div className={`${sizes[size]} rounded-full ${getColor(name)} text-white flex items-center justify-center font-semibold`}>
      {initials}
    </div>
  )
}
