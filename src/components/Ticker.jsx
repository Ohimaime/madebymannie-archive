import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

const ITEMS = [
  'Capsule 001',
  'Unreleased',
  'Built, not designed',
  'Item 001 — 018',
  'Balvd / Clutch / Storm / Concepts',
  'Season FW26',
  'Nothing here is final',
  'Archive 001',
  'Madebymannie',
]

function Run({ hidden }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {ITEMS.map((item) => (
        <li key={item} className="flex items-center">
          <span className="font-mono text-lg font-bold tracking-[0.08em] whitespace-nowrap uppercase md:text-2xl">
            {item}
          </span>
          <span aria-hidden="true" className="mx-6 inline-block size-3 bg-ink md:mx-10 md:size-4" />
        </li>
      ))}
    </ul>
  )
}

// Section 03 — signal strip. Constant crawl; scroll velocity kicks it faster, then it decays back.
export default function Ticker() {
  const root = useRef(null)
  const track = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Two identical runs in the track, so -50% lands exactly where it started.
        // Created paused: ScrollTrigger starts it only once the strip is actually on screen.
        const crawl = gsap.to(track.current, { xPercent: -50, ease: 'none', duration: 40, repeat: -1, paused: true })
        const speed = { value: 1 }
        const apply = () => crawl.timeScale(speed.value)

        ScrollTrigger.create({
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          // onToggle fires on all four edges (enter, leave, enterBack, leaveBack): the crawl only runs on screen.
          onToggle: (self) => (self.isActive ? crawl.play() : crawl.pause()),
          onUpdate: (self) => {
            const v = Math.abs(self.getVelocity())
            if (v < 60 && speed.value === 1) return // nothing to boost — skip allocating a tween this frame
            const boost = gsap.utils.clamp(1, 4, 1 + v / 800)
            if (boost > speed.value) {
              speed.value = boost
              apply()
            }
            gsap.to(speed, { value: 1, duration: 1.2, ease: 'power2.out', overwrite: true, onUpdate: apply })
          },
        })
      })
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      aria-label="Capsule 001 signal"
      className="relative z-10 overflow-hidden border-y-2 border-ink bg-signal py-4 text-ink md:py-6"
    >
      <p className="label absolute inset-y-0 left-0 z-10 flex items-center bg-ink px-4 font-bold text-signal md:px-8">
        04 / Signal
      </p>
      <div ref={track} className="flex w-max">
        <Run />
        <Run hidden />
      </div>
    </section>
  )
}
