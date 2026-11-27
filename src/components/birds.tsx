// The six bird avatars. Each is a round little bird facing you, drawn on a
// soft Meadow-coloured circle, so they sit happily next to each other.

import { BIRD_NAMES, type Bird } from '../lib/birds'

const INK = '#23302A'

function Eyes({ y = 31, dx = 7, r = 3 }: { y?: number; dx?: number; r?: number }) {
  return (
    <g>
      <circle cx={32 - dx} cy={y} r={r} fill={INK} />
      <circle cx={32 + dx} cy={y} r={r} fill={INK} />
      <circle cx={32 - dx + 1} cy={y - 1} r={r / 3} fill="#FFFFFF" />
      <circle cx={32 + dx + 1} cy={y - 1} r={r / 3} fill="#FFFFFF" />
    </g>
  )
}

function Feet({ color }: { color: string }) {
  return <path d="M27 55v4M37 55v4M25 59h4M35 59h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
}

const DRAWINGS: Record<Bird, { bg: string; art: React.ReactNode }> = {
  sparrow: {
    bg: '#F8DCCB',
    art: (
      <>
        <Feet color="#8A5A2B" />
        <ellipse cx="32" cy="38" rx="19" ry="18" fill="#A97142" />
        <ellipse cx="32" cy="45" rx="12" ry="9" fill="#EBD7B8" />
        <path d="M14 34c2-12 10-17 18-17s16 5 18 17c-5-6-11-8-18-8s-13 2-18 8Z" fill="#6E4524" />
        <ellipse cx="22" cy="38" rx="3.5" ry="2.2" fill="#E7A98E" opacity=".8" />
        <ellipse cx="42" cy="38" rx="3.5" ry="2.2" fill="#E7A98E" opacity=".8" />
        <Eyes />
        <path d="M28.5 36h7L32 41Z" fill="#E8A23B" />
      </>
    ),
  },
  robin: {
    bg: '#CFE5D2',
    art: (
      <>
        <Feet color="#6E4524" />
        <ellipse cx="32" cy="38" rx="19" ry="18" fill="#8A6A4F" />
        <path d="M17 36c0-6 7-10 15-10s15 4 15 10c0 9-7 16-15 16s-15-7-15-16Z" fill="#E8743B" />
        <ellipse cx="32" cy="51" rx="9" ry="4" fill="#F3E6D3" />
        <Eyes y={30} />
        <path d="M29 34.5h6L32 39Z" fill="#3B2A1E" />
      </>
    ),
  },
  owl: {
    bg: '#E3DDF2',
    art: (
      <>
        <Feet color="#6E4524" />
        <path d="M15 22l6 8M49 22l-6 8" stroke="#6E5038" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="32" cy="38" rx="19" ry="19" fill="#8A6B4E" />
        <ellipse cx="32" cy="46" rx="11" ry="9" fill="#D9C3A3" />
        <path d="M27 44l2 2 2-2M33 44l2 2 2-2M30 49l2 2 2-2" fill="none" stroke="#8A6B4E" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="24.5" cy="32" r="7.5" fill="#FBEFD9" />
        <circle cx="39.5" cy="32" r="7.5" fill="#FBEFD9" />
        <Eyes y={32} dx={7.5} r={3.6} />
        <path d="M30 37h4l-2 4Z" fill="#E8A23B" />
      </>
    ),
  },
  bluetit: {
    bg: '#D6E6F2',
    art: (
      <>
        <Feet color="#4E5D66" />
        <ellipse cx="32" cy="38" rx="19" ry="18" fill="#6E9C8E" />
        <ellipse cx="32" cy="44" rx="13" ry="11" fill="#F2C84B" />
        <path d="M17 31c3-9 9-13 15-13s12 4 15 13c-4-3-9-5-15-5s-11 2-15 5Z" fill="#4F8FC9" />
        <path d="M18 31c4-3 9-4 14-4s10 1 14 4c-1 5-6 8-14 8s-13-3-14-8Z" fill="#FFFFFF" />
        <path d="M18 31.5h28" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        <Eyes y={31.5} />
        <path d="M29.5 36h5L32 39.5Z" fill="#3B3B3B" />
      </>
    ),
  },
  duck: {
    bg: '#FBEFD9',
    art: (
      <>
        <Feet color="#E8862F" />
        <path d="M30 20c-1-4 2-6 4-5" fill="none" stroke="#E6B23A" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="32" cy="38" rx="19" ry="18" fill="#F5C84C" />
        <ellipse cx="18" cy="42" rx="4" ry="7" fill="#E6B23A" transform="rotate(20 18 42)" />
        <ellipse cx="46" cy="42" rx="4" ry="7" fill="#E6B23A" transform="rotate(-20 46 42)" />
        <ellipse cx="23" cy="38" rx="3" ry="2" fill="#F4A98A" opacity=".8" />
        <ellipse cx="41" cy="38" rx="3" ry="2" fill="#F4A98A" opacity=".8" />
        <Eyes y={30} />
        <ellipse cx="32" cy="37.5" rx="6" ry="3.2" fill="#E8862F" />
      </>
    ),
  },
  kingfisher: {
    bg: '#D6E6F2',
    art: (
      <>
        <Feet color="#C0502A" />
        <ellipse cx="32" cy="38" rx="19" ry="18" fill="#2E8FB5" />
        <ellipse cx="32" cy="46" rx="12.5" ry="9.5" fill="#E8862F" />
        <path d="M24 37c2 3 5 4 8 4s6-1 8-4" fill="#FFFFFF" />
        <path d="M16 30c4-2 7-2 9 0M48 30c-4-2-7-2-9 0" stroke="#E8862F" strokeWidth="3" strokeLinecap="round" />
        <Eyes y={30} />
        <path d="M29.5 34h5L32 43Z" fill={INK} />
      </>
    ),
  },
}

interface AvatarProps {
  bird: Bird
  size?: number
  className?: string
  /** Hide it from screen readers when a label next to it already says it. */
  decorative?: boolean
}

export function BirdAvatar({ bird, size = 40, className, decorative = false }: AvatarProps) {
  const { bg, art } = DRAWINGS[bird] ?? DRAWINGS.sparrow
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': BIRD_NAMES[bird] }
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" {...a11y}>
      <circle cx="32" cy="32" r="32" fill={bg} />
      {art}
    </svg>
  )
}
