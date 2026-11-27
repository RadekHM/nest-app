import { useId } from 'react'

type Props = {
  size?: number
  /** Adds the swaying leaf; leave off for small inline uses. */
  leaf?: boolean
  className?: string
}

const BOWL = 'M78 262 C 88 432, 424 432, 434 262 C 388 300, 124 300, 78 262 Z'

/**
 * The Nest logo: a woven nest with two eggs that wobble now and then.
 * Purely decorative, so it is hidden from screen readers.
 */
export function NestLogo({ size = 48, leaf = true, className }: Props) {
  const clipId = `nest-bowl-${useId().replace(/:/g, '')}`
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="30 70 452 380"
      aria-hidden="true"
      data-testid="nest-logo"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BOWL} />
        </clipPath>
      </defs>
      {leaf && (
        <>
          <path className="leaf-sway" d="M362 150c36-56 98-64 116-62-2 36-32 98-104 92z" fill="#8FB996" />
          <path d="M366 184c28-30 62-60 98-86" fill="none" stroke="#3F6B4B" strokeWidth="8" strokeLinecap="round" />
        </>
      )}
      <ellipse cx="256" cy="264" rx="176" ry="46" fill="#5E3B1F" />
      <g className="egg-a">
        <ellipse cx="204" cy="208" rx="70" ry="90" fill="#FBEFD9" stroke="#C9A46A" strokeWidth="7" />
      </g>
      <g className="egg-b">
        <ellipse cx="306" cy="196" rx="68" ry="94" fill="#CFE3D3" stroke="#7FA488" strokeWidth="7" />
        <circle cx="288" cy="160" r="7" fill="#7FA488" />
        <circle cx="322" cy="184" r="5" fill="#7FA488" />
        <circle cx="300" cy="222" r="6" fill="#7FA488" />
      </g>
      <path d={BOWL} fill="#A97142" />
      <g clipPath={`url(#${clipId})`} fill="none" strokeLinecap="round">
        <path d="M70 300 C 170 340, 342 340, 442 300" stroke="#C99561" strokeWidth="16" />
        <path d="M80 340 C 180 382, 332 382, 432 340" stroke="#8A5A2B" strokeWidth="15" />
        <path d="M100 378 C 190 410, 322 410, 412 378" stroke="#C99561" strokeWidth="14" />
        <g stroke="#6E4524" strokeWidth="8" opacity=".7">
          <path d="M110 270 L 190 420" />
          <path d="M190 280 L 236 430" />
          <path d="M322 280 L 276 430" />
          <path d="M402 270 L 322 420" />
        </g>
      </g>
      <path d="M78 262 C 124 300, 388 300, 434 262" fill="none" stroke="#C99561" strokeWidth="18" strokeLinecap="round" />
      <g fill="none" strokeLinecap="round">
        <path d="M84 266 L 44 242" stroke="#8A5A2B" strokeWidth="11" />
        <path d="M428 264 L 470 246" stroke="#8A5A2B" strokeWidth="11" />
      </g>
    </svg>
  )
}
