/**
 * Cartoon mascot — robot face with antenna, headphones, blinking pupils
 * and three orbiting particles. Decorative; visual identity for the
 * autonomous agent.
 *
 * Ported verbatim from the Claude Design handoff (cartoon.jsx). All
 * movement is CSS keyframes (see .mascot-* in globals.css) so React
 * never re-renders a tick.
 */

export function Mascot() {
  return (
    <div className="mascot" aria-hidden>
      <div className="mascot-orbit">
        <div className="o o1" />
        <div className="o o2" />
        <div className="o o3" />
      </div>
      <svg viewBox="0 0 72 72" fill="none">
        {/* antenna */}
        <path className="mascot-antenna" d="M36 8 L36 16" />
        <circle className="mascot-antenna-bulb" cx="36" cy="6" r="3.2" />
        {/* face plate */}
        <rect
          x="14"
          y="14"
          width="44"
          height="40"
          rx="14"
          fill="#fff"
          stroke="#2a1f55"
          strokeWidth={2.5}
        />
        {/* headphones */}
        <path
          className="mascot-headphones"
          d="M12 28 Q12 14, 36 14 Q60 14, 60 28"
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <rect x="8" y="26" width="6" height="12" rx="3" fill="#2a1f55" />
        <rect x="58" y="26" width="6" height="12" rx="3" fill="#2a1f55" />
        {/* eyes */}
        <g className="mascot-pupil" style={{ transformOrigin: "26px 32px" }}>
          <circle cx="26" cy="32" r="3.2" />
        </g>
        <g className="mascot-pupil" style={{ transformOrigin: "46px 32px" }}>
          <circle cx="46" cy="32" r="3.2" />
        </g>
        {/* cheeks */}
        <circle className="mascot-cheek" cx="22" cy="42" r="3" />
        <circle className="mascot-cheek" cx="50" cy="42" r="3" />
        {/* mouth */}
        <path className="mascot-mouth" d="M28 42 Q36 48, 44 42" />
      </svg>
    </div>
  );
}
