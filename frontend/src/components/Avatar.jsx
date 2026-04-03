export default function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-20 h-20 text-2xl' }
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold`}>
      {initials}
    </div>
  )
}
