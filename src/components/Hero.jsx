import { useRef } from 'react'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

const SPEC = [
  ['Item', '001 — 018'],
  ['Material', 'Heavyweight cotton'],
  ['Origin', 'Studio / MBM'],
  ['Status', 'Unreleased'],
]

export default function Hero() {
  const root = useRef(null)
  const progress = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Phase 2 — intro. Characters slam up through a mask; everything else cuts in on stepped eases.
        const intro = gsap.timeline({ delay: 0.35 })

        intro.from('[data-meta]', { autoAlpha: 0, duration: 0.4, ease: 'steps(3)', stagger: 0.06 })

        SplitText.create('[data-wordmark]', {
          type: 'chars',
          mask: 'chars',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.chars, {
              yPercent: 110,
              duration: 0.9,
              ease: 'expo.out',
              stagger: 0.03,
              delay: 0.45,
            }),
        })

        intro
          .from(
            '[data-slab]',
            { clipPath: 'inset(0% 100% 0% 0%)', duration: 0.6, ease: 'steps(5)' },
            0.9,
          )
          .from(
            '[data-spec-row]',
            { autoAlpha: 0, xPercent: -6, duration: 0.3, ease: 'steps(2)', stagger: 0.08 },
            1.1,
          )

        // Phase 3 — scroll. Wordmark lines shear apart, the red slab rises faster than the page.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: 'top top',
              end: 'bottom top',
              scrub: 1,
              onUpdate: (st) => {
                progress.current.textContent = String(Math.round(st.progress * 100)).padStart(3, '0')
              },
            },
          })
          .to('[data-line="1"]', { xPercent: -22, ease: 'none' }, 0)
          .to('[data-line="2"]', { xPercent: 14, ease: 'none' }, 0)
          .to('[data-slab]', { yPercent: -90, rotation: -3, ease: 'none' }, 0)
          .to('[data-spec]', { yPercent: -40, ease: 'none' }, 0)
      })
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      id="top"
      className="relative z-10 flex min-h-svh flex-col overflow-hidden px-4 md:px-8"
      aria-label="MADEBYMANNIE Capsule 001"
    >
      {/* Meta bar — spec-sheet header */}
      <header className="grid grid-cols-4 border-b-2 border-ink py-3 md:grid-cols-12">
        <p data-meta className="label col-span-2 md:col-span-3">MBM / Capsule 001</p>
        <p data-meta className="label hidden md:col-span-3 md:block">Manifesto + Drop</p>
        <p data-meta className="label hidden md:col-span-3 md:block">Season FW26</p>
        <p data-meta className="label col-span-2 text-right md:col-span-3">
          Scroll <span ref={progress}>000</span>%
        </p>
      </header>

      {/* Wordmark — bleeds off both edges, asymmetric offset on line 2 */}
      <h1
        data-wordmark
        className="relative mt-[3svh] font-display text-[min(21vw,24svh)] font-bold leading-[0.9] tracking-[-0.06em] uppercase md:text-[min(19vw,30svh)]"
      >
        <span data-line="1" className="-ml-[0.06em] block whitespace-nowrap">
          Made by
        </span>{' '}
        <span data-line="2" className="block whitespace-nowrap pl-[16.66vw] text-signal md:pl-[25vw]">
          Mannie
        </span>
      </h1>

      {/* Red slab — sits clear of the wordmark at rest; scroll drives it up across it */}
      <div
        data-slab
        className="relative z-20 mt-6 mb-4 ml-auto w-3/4 bg-signal p-3 text-ink md:mt-0 md:w-1/3 md:p-4"
      >
        <p className="label font-bold">Capsule 001</p>
        <p className="mt-6 font-display text-2xl leading-none font-bold uppercase md:text-4xl">
          Garments for the
          <br />
          unfinished city.
        </p>
        <p className="label mt-6">Drop — date TBA</p>
      </div>

      {/* Spec sheet + footer row */}
      <div className="mt-auto grid grid-cols-4 items-end gap-y-6 border-t-2 border-ink py-4 md:grid-cols-12">
        <dl data-spec className="col-span-4 md:col-span-4">
          {SPEC.map(([k, v]) => (
            <div key={k} data-spec-row className="grid grid-cols-2 border-b border-ink py-1 last:border-b-0">
              <dt className="label">{k}</dt>
              <dd className="label font-bold">{v}</dd>
            </div>
          ))}
        </dl>
        <p data-meta className="label col-span-2 md:col-span-2 md:col-start-9">
          01 / 06
        </p>
        <p data-meta className="label col-span-2 text-right md:col-span-2 md:col-start-11">
          Scroll ↓
        </p>
      </div>
    </section>
  )
}
