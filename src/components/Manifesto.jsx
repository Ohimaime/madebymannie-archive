import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { BRANDS, CAPSULE } from '../data/capsule.js'
import { useArchive } from '../archiveContext.js'

const COUNTS = Object.fromEntries(BRANDS.map((b) => [b.key, CAPSULE.filter((i) => i.brand === b.key).length]))

const pad = (n) => String(n).padStart(2, '0')

const CLIP_BELOW = 'inset(100% 0% 0% 0%)'
const CLIP_SHOWN = 'inset(0% 0% 0% 0%)'
const CLIP_ABOVE = 'inset(0% 0% 100% 0%)'

// The page's single pinned section: one slate per house. Without motion (reduced-motion / no JS)
// it renders as a plain stacked list; `data-pinned` switches it into the one-slate-at-a-time stage.
export default function Manifesto() {
  const { showHouse } = useArchive()
  const root = useRef(null)
  const counter = useRef(null)
  const meta = useRef(null)
  const footer = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 768px)' },
        (ctx) => {
          if (!ctx.conditions.motion) return

          const section = root.current
          const items = gsap.utils.toArray('[data-statement]')
          const notches = gsap.utils.toArray('[data-notch]')
          let shown = 0

          // Off-stage slates are clipped away; `inert` also keeps their buttons out of the tab order.
          const stage = (i) => items.forEach((el, n) => (el.inert = n !== i))
          section.dataset.pinned = ''
          stage(0)
          gsap.set(items.slice(1), { clipPath: CLIP_BELOW })
          gsap.set(notches.slice(1), { scaleY: 0, transformOrigin: 'top center' })

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: ctx.conditions.desktop ? '+=300%' : '+=200%',
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              snap: { snapTo: 'labelsDirectional', delay: 0.15, duration: 0.3, inertia: false },
            },
            onUpdate: () => {
              // The counter flips at the midpoint of each wipe.
              const i = Math.min(items.length - 1, Math.round(tl.time()))
              if (i === shown) return
              shown = i
              stage(i)
              counter.current.textContent = pad(i + 1)
              meta.current.textContent = `${i + 1}/${items.length}`
              footer.current.textContent = pad(i + 1)
            },
          })

          tl.addLabel('s0', 0)
          items.slice(1).forEach((item, n) => {
            const i = n + 1
            const at = i - 0.65
            tl.fromTo(items[i - 1], { clipPath: CLIP_SHOWN }, { clipPath: CLIP_ABOVE, duration: 0.3, ease: 'steps(4)' }, at)
              .fromTo(item, { clipPath: CLIP_BELOW }, { clipPath: CLIP_SHOWN, duration: 0.3, ease: 'steps(4)' }, at)
              .to(notches[i], { scaleY: 1, duration: 0.3, ease: 'steps(4)' }, at)
              .addLabel(`s${i}`, i)
          })
          tl.set({}, {}, items.length - 1) // run to exactly the last label so it snaps at the end

          return () => {
            delete section.dataset.pinned
            items.forEach((el) => (el.inert = false))
          }
        },
      )
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      aria-labelledby="manifesto-heading"
      className="group relative z-10 flex flex-col overflow-x-clip border-t-2 border-ink px-4 md:px-8 data-[pinned]:h-svh"
    >
      <header className="grid grid-cols-4 border-b-2 border-ink py-3 md:grid-cols-12">
        <h2 id="manifesto-heading" className="label col-span-2 md:col-span-3">03 / Manifesto</h2>
        <p className="label hidden md:col-span-6 md:block">File: MBM-001 / Four houses</p>
        <p className="label invisible col-span-2 text-right group-data-[pinned]:visible md:col-span-3" aria-hidden="true">
          [ <span ref={meta}>1/{BRANDS.length}</span> ]
        </p>
      </header>

      <div className="grid flex-1 grid-cols-4 group-data-[pinned]:grid-rows-[auto_1fr] md:grid-cols-12 md:group-data-[pinned]:grid-rows-1">
        {/* Index + 4-notch progress rail — only meaningful while pinned */}
        <div
          aria-hidden="true"
          className="col-span-4 hidden items-start gap-4 pt-6 group-data-[pinned]:flex md:col-span-3 md:pt-10"
        >
          <div className="flex h-24 w-2 flex-col gap-1 md:h-[40svh]">
            {BRANDS.map((_, i) => (
              <span key={i} className="relative flex-1 bg-rule">
                <span data-notch className="absolute inset-0 bg-ink" />
              </span>
            ))}
          </div>
          <span
            ref={counter}
            className="font-display text-[min(22vw,14svh)] leading-[0.8] font-bold tracking-[-0.06em] tabular-nums md:text-[min(13vw,26svh)]"
          >
            01
          </span>
        </div>

        <ol className="relative col-span-4 md:col-span-9">
          {BRANDS.map((b) => (
            <li
              key={b.key}
              data-statement
              className="flex flex-col items-start border-b border-ink py-10 last:border-b-0 group-data-[pinned]:absolute group-data-[pinned]:inset-0 group-data-[pinned]:justify-center group-data-[pinned]:border-b-0 group-data-[pinned]:py-0"
            >
              <p className="label mb-4">
                House {b.no} / {pad(BRANDS.length)}{' '}
                <span className="ml-2 bg-signal px-2 font-bold text-ink">{pad(COUNTS[b.key])} pieces</span>
              </p>
              <h3 className={`font-display font-bold ${b.display} leading-[0.85] uppercase`}>{b.name}</h3>
              {b.ethos && (
                <p className="mt-5 max-w-[44ch] font-display text-lg leading-tight font-bold uppercase md:text-[min(2.2vw,3.8svh)]">
                  {b.ethos}
                </p>
              )}
              <button
                type="button"
                onClick={() => showHouse(b.key)}
                className="label mt-6 cursor-pointer border-2 border-ink px-3 py-2 font-bold hover:bg-ink hover:text-paper"
              >
                [Filter archive ↓]
              </button>
            </li>
          ))}
        </ol>
      </div>

      <footer className="hidden grid-cols-4 border-t-2 border-ink py-3 group-data-[pinned]:grid md:grid-cols-12">
        <p className="label col-span-3 md:col-span-6" aria-hidden="true">
          House <span ref={footer}>01</span> / {pad(BRANDS.length)}<span className="hidden md:inline"> — Capsule 001 archive</span>
        </p>
        <p className="label col-span-1 text-right md:col-span-3 md:col-start-10">Scroll ↓</p>
      </footer>
    </section>
  )
}
