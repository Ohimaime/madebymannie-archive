import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

// Context block between the hero and the house slates — anchors the site as a personal archive.
export default function Bio() {
  const root = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: 'top 75%', once: true } })
          .from('[data-bio-meta]', { autoAlpha: 0, duration: 0.3, ease: 'steps(3)', stagger: 0.06 })
          .from('[data-bio-name]', { clipPath: 'inset(0% 100% 0% 0%)', duration: 0.5, ease: 'steps(5)' }, 0.1)
          .from('[data-bio-line]', { autoAlpha: 0, duration: 0.3, ease: 'steps(3)' }, 0.45)
      })
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      aria-labelledby="bio-heading"
      className="relative z-10 border-t-2 border-ink bg-paper px-4 md:px-8"
    >
      <header className="grid grid-cols-4 border-b-2 border-ink py-3 md:grid-cols-12">
        <p data-bio-meta className="label col-span-2 md:col-span-3">02 / Archive</p>
        <p data-bio-meta className="label col-span-2 text-right md:col-span-3 md:col-start-10">Personal portfolio</p>
      </header>

      <div className="grid grid-cols-4 gap-y-6 py-12 md:grid-cols-12 md:py-20">
        <h2
          id="bio-heading"
          data-bio-name
          className="col-span-4 font-display text-[clamp(2.75rem,11vw,9rem)] leading-[0.85] font-bold tracking-[-0.06em] md:col-span-12"
        >
          Madebymannie
        </h2>
        <p
          data-bio-line
          className="col-span-4 border-l-2 border-signal pl-3 font-mono text-base leading-snug uppercase md:col-span-6 md:col-start-7 md:pl-4 md:text-xl"
        >
          This archive documents creative concept design, apparel engineering and brand architecture.
        </p>
      </div>
    </section>
  )
}
