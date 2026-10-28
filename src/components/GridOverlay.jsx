import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

// Phase 1 — the visible construction grid as ONE painted layer (4 cols mobile, 12 desktop).
// The draw-in is a single stepped clip-path wipe instead of animating a node per line.
export default function GridOverlay() {
  const layer = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(layer.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'steps(6)' })
    })
  })

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 px-4 md:px-8">
      <div
        ref={layer}
        className="h-full border-r border-rule [--cols:4] md:[--cols:12]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, var(--color-rule) 0 1px, transparent 1px calc(100% / var(--cols)))',
        }}
      />
    </div>
  )
}
