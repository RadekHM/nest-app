/** A little bird that hops across the bottom of a card. Decorative only. */
export function WalkingBird() {
  return (
    <svg className="bird" width="30" height="24" viewBox="0 0 30 24" aria-hidden="true">
      <g className="bird-body">
        <path d="M3 13 L-1 10 L1 15 Z" fill="#8A5A2B" />
        <ellipse cx="13" cy="14" rx="10" ry="7" fill="#A97142" />
        <ellipse cx="11" cy="15" rx="5" ry="3.5" fill="#C99561" />
        <circle cx="21" cy="9" r="5" fill="#A97142" />
        <circle cx="22.5" cy="8" r="1.2" fill="#23302A" />
        <path d="M26 9 L30 10 L26 11 Z" fill="#E8A23B" />
        <path d="M11 21 v3 M15 21 v3" stroke="#8A5A2B" strokeWidth="1.5" />
      </g>
    </svg>
  )
}
