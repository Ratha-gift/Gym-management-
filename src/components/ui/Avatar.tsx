interface AvatarProps {
  name: string
  size?: number
  /** Photo URL or base64 data URI — shown instead of the initials when present. */
  photo?: string | null
}

const PALETTE = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2']

function colorFor(name: string) {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return PALETTE[hash % PALETTE.length]
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function Avatar({ name, size = 36, photo }: AvatarProps) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="inline-block shrink-0 rounded-full object-cover select-none"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none"
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.4 }}
    >
      {initialsFor(name)}
    </span>
  )
}
