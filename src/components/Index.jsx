import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { BRANDS, CAPSULE, LEADS, brandOf, byId } from '../data/capsule.js'
import { useDossier } from '../dossierContext.js'
import { useArchive } from '../archiveContext.js'
import GarmentFrame from './GarmentFrame.jsx'

// Asymmetric placement on the 12-col grid, by slot. Slot 0 is the wide card; slots 1 and 3 sit
// off-register and drift on scroll.
const SLOTS = [
  'md:col-span-7',
  'md:col-span-4 md:col-start-9 md:mt-[24svh]',
  'md:col-span-4 md:col-start-2',
  'md:col-span-4 md:col-start-7 md:mt-[14svh]',
]
const DRIFT_SLOTS = new Set([1, 3])

const CLIP_BELOW = 'inset(100% 0% 0% 0%)'
const CLIP_SHOWN = 'inset(0% 0% 0% 0%)'

const FILTERS = [
  { key: 'all', label: 'All', count: CAPSULE.length },
  ...BRANDS.map((b) => ({ key: b.key, label: b.filterLabel, count: CAPSULE.filter((i) => i.brand === b.key).length })),
]

// "[+] View dossier" tag: snaps in on hover / keyboard focus; always shown on touch (no hover there).
const AFFORDANCE =
  'label bg-signal font-bold text-ink invisible group-hover:visible group-has-[:focus-visible]:visible [@media(hover:none)]:visible'

// Prefetch the sheet on hover / focus so the dossier opens onto a loaded image.
const prefetch = (item) => item.sheet && (new Image().src = item.sheet.src)

function Card({ item, slot }) {
  const { open } = useDossier()
  const headingId = `item-${item.id}`
  const wide = slot === 0
  return (
    <article
      data-card
      data-dossier-origin
      data-drift={DRIFT_SLOTS.has(slot) || undefined}
      aria-labelledby={headingId}
      className={`group relative col-span-4 border-2 border-ink bg-paper outline-offset-4 has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-signal ${SLOTS[slot]}`}
    >
      <div className="flex items-center justify-between gap-2 border-b-2 border-ink px-3 py-2 group-hover:bg-ink group-hover:text-paper">
        <p className="label">
          {brandOf(item).no} {brandOf(item).name} / Item {item.id}
        </p>
        <p className="label bg-signal px-2 font-bold text-ink">{item.status}</p>
      </div>

      <div className={wide ? 'md:grid md:grid-cols-[4fr_3fr]' : undefined}>
        {/* 4:5 slot framed on the sheet's FRONT view */}
        <GarmentFrame
          sheet={item.sheet}
          view="front"
          aspect={0.8}
          loading="lazy"
          alt={`${item.name}, front view`}
          className={`border-b-2 border-ink ${wide ? 'md:border-r-2 md:border-b-0' : ''}`}
        >
          <span aria-hidden="true" data-cross="x" className="absolute inset-x-0 top-1/2 h-px bg-current opacity-20" />
          <span aria-hidden="true" data-cross="y" className="absolute inset-y-0 left-1/2 w-px bg-current opacity-20" />
          <p aria-hidden="true" className="label absolute right-3 bottom-3">Front // flat</p>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ink opacity-0 group-hover:opacity-25" />
          <p aria-hidden="true" className={`${AFFORDANCE} absolute top-1/2 left-1/2 -translate-1/2 border-2 border-ink px-3 py-2`}>
            [+] View dossier
          </p>
        </GarmentFrame>

        <div className={`p-3 md:p-4 ${wide ? 'md:flex md:flex-col md:justify-end' : ''}`}>
          <h3
            id={headingId}
            className="font-display text-4xl leading-[0.9] font-bold tracking-[-0.04em] uppercase md:text-[min(3.6vw,7svh)]"
          >
            {/* Stretched button: the whole card is the hit area, the name is its label. */}
            <button
              type="button"
              data-dossier-trigger={item.id}
              aria-haspopup="dialog"
              onClick={(e) => open(item.id, e.currentTarget)}
              onPointerEnter={() => prefetch(item)}
              onFocus={() => prefetch(item)}
              className="cursor-pointer text-left uppercase outline-none after:absolute after:inset-0 after:content-['']"
            >
              {item.name}
            </button>
          </h3>
          <dl className="mt-4 border-t border-ink">
            {[
              ['Material', item.material],
              ['Fit', item.fit],
              ['Colourway', item.colourway],
              ['Sizes', item.sizes],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-2 border-b border-ink py-1 last:border-b-0">
                <dt className="label">{k}</dt>
                <dd className="label font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <p aria-hidden="true" className="label mt-4 font-bold group-hover:text-signal">
            [Open dossier →]
          </p>
        </div>
      </div>
    </article>
  )
}

// Index — up to four featured cards for the active house, then the parts list.
export default function Index() {
  const root = useRef(null)
  const lastFilter = useRef(null)
  const { open } = useDossier()
  const { filter, setFilter } = useArchive()

  const house = BRANDS.find((b) => b.key === filter)
  const featured = (house ? house.spotlight : LEADS).map(byId)
  const rows = house ? CAPSULE.filter((i) => i.brand === house.key) : CAPSULE

  // One-time reveals for the section chrome and the parts list.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-index-meta]', {
          autoAlpha: 0,
          duration: 0.4,
          ease: 'steps(3)',
          stagger: 0.06,
          scrollTrigger: { trigger: root.current, start: 'top 80%' },
        })
        // Opacity only (not autoAlpha) so rows stay in the accessibility tree before they reveal.
        gsap.set('[data-row]', { opacity: 0 })
        ScrollTrigger.batch('[data-row]', {
          start: 'top 92%',
          once: true,
          onEnter: (els) => gsap.to(els, { opacity: 1, duration: 0.2, ease: 'steps(2)', stagger: 0.03 }),
        })
      })
    },
    { scope: root },
  )

  // Cards are rebuilt per filter: scroll-revealed the first time, re-cut immediately on a filter change.
  useGSAP(
    () => {
      // Compare against the last filter (not a "first run" flag): StrictMode re-runs effects in dev.
      const initial = lastFilter.current === null || lastFilter.current === filter
      lastFilter.current = filter
      if (!initial) {
        gsap.set('[data-row]', { opacity: 1 })
        ScrollTrigger.refresh() // the section's height just changed
      }

      const mm = gsap.matchMedia()
      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 768px)' },
        (ctx) => {
          if (!ctx.conditions.motion) return
          const reveal = (cards) =>
            cards.forEach((card, i) =>
              gsap
                .timeline({ delay: i * 0.08 })
                .fromTo(card, { clipPath: CLIP_BELOW }, { clipPath: CLIP_SHOWN, duration: 0.5, ease: 'steps(4)' })
                .fromTo(card.querySelector('[data-cross="x"]'), { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'steps(3)' })
                .fromTo(card.querySelector('[data-cross="y"]'), { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'steps(3)' }, '<'),
            )

          if (initial) {
            gsap.set('[data-card]', { clipPath: CLIP_BELOW })
            ScrollTrigger.batch('[data-card]', { start: 'top 85%', once: true, onEnter: reveal })
          } else {
            reveal(gsap.utils.toArray('[data-card]'))
          }

          // Off-register drift — desktop only; on mobile the cards are a single stack.
          if (ctx.conditions.desktop) {
            gsap.utils.toArray('[data-drift]').forEach((card) =>
              gsap.to(card, {
                yPercent: -8,
                ease: 'none',
                scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1 },
              }),
            )
          }
        },
      )
    },
    { scope: root, dependencies: [filter], revertOnUpdate: true },
  )

  return (
    <section
      ref={root}
      id="index"
      aria-labelledby="index-heading"
      className="relative z-10 border-t-2 border-ink px-4 pb-24 md:px-8"
    >
      <header className="grid grid-cols-4 border-b-2 border-ink py-3 md:grid-cols-12">
        <p data-index-meta className="label col-span-2 md:col-span-3">05 / Index</p>
        <p data-index-meta className="label col-span-2 text-right md:col-span-3 md:col-start-10">
          {rows.length} items / {String(featured.length).padStart(2, '0')} featured
        </p>
      </header>

      <h2
        id="index-heading"
        tabIndex={-1}
        className="mt-10 font-display text-[min(16vw,22svh)] leading-[0.85] font-bold tracking-[-0.06em] uppercase outline-none md:text-[min(11vw,22svh)]"
      >
        Capsule <span className="text-signal">001</span>
      </h2>

      {/* Filter header — names the active house. */}
      <div className="mt-6 mb-12 border-y-2 border-ink py-4 md:mb-20">
        <p aria-live="polite" className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="label">Showing //</span>
          {house ? (
            <span className="font-display text-4xl leading-none font-bold tracking-[-0.04em] uppercase md:text-6xl">
              {house.no} {house.name}
            </span>
          ) : (
            <span className="font-display text-4xl leading-none font-bold tracking-[-0.04em] uppercase md:text-6xl">All houses</span>
          )}
          <span className="label">{rows.length} pieces</span>
        </p>
        <div role="group" aria-label="Filter archive by house" className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`label cursor-pointer border-2 border-ink px-3 py-2 font-bold ${filter === f.key ? 'bg-ink text-paper' : 'hover:bg-ink/10'}`}
            >
              [{f.label} ({f.count})]
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-y-10 md:grid-cols-12 md:gap-y-20">
        {featured.map((item, slot) => (
          <Card key={item.id} item={item} slot={slot} />
        ))}
      </div>

      {/* Parts list — every piece in the active house as a real table */}
      <div className="mt-24 md:mt-40">
        <h3 id="parts-heading" className="label mb-3 font-bold">
          Parts list — Capsule 001 / {rows.length} items
        </h3>
        <table aria-labelledby="parts-heading" className="w-full border-collapse border-t-2 border-ink text-left">
          <thead>
            <tr className="border-b-2 border-ink">
              <th scope="col" className="label py-2 pr-4 font-normal">No.</th>
              <th scope="col" className="label py-2 pr-4 font-normal">Item</th>
              <th scope="col" className="label hidden py-2 pr-4 font-normal md:table-cell">House</th>
              <th scope="col" className="label hidden py-2 pr-4 font-normal md:table-cell">Category</th>
              <th scope="col" className="label hidden py-2 pr-4 font-normal lg:table-cell">Material</th>
              <th scope="col" className="label py-2 text-right font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              // The row is the hit area. (Not a stretched ::after: WebKit won't position against a <tr>,
              // so the overlay escaped to the whole section and the last row swallowed every click.)
              <tr
                key={item.id}
                data-row
                data-dossier-origin
                onClick={(e) => open(item.id, e.currentTarget.querySelector('[data-dossier-trigger]'))}
                onPointerEnter={() => prefetch(item)}
                className="group cursor-pointer border-b border-ink align-baseline outline-offset-[-3px] hover:bg-ink hover:text-paper has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-signal"
              >
                <td className="label py-3 pr-4 font-bold">{item.id}</td>
                <th scope="row" className="py-3 pr-4 font-display text-lg leading-tight font-bold uppercase md:text-2xl">
                  {/* Keyboard / screen-reader control; its click bubbles to the row, which opens the dossier. */}
                  <button
                    type="button"
                    data-dossier-trigger={item.id}
                    aria-haspopup="dialog"
                    onFocus={() => prefetch(item)}
                    className="cursor-pointer text-left uppercase outline-none"
                  >
                    {item.name}
                  </button>
                  <span className="label mt-1 block font-normal md:hidden">
                    {brandOf(item).name} · {item.material}
                  </span>
                  <span aria-hidden="true" className={`${AFFORDANCE} mt-2 block w-fit px-1 md:hidden`}>[+] View dossier</span>
                </th>
                <td className="label hidden py-3 pr-4 md:table-cell">{brandOf(item).no} {brandOf(item).name}</td>
                <td className="label hidden py-3 pr-4 md:table-cell">{item.category}</td>
                <td className="label hidden py-3 pr-4 lg:table-cell">{item.material}</td>
                <td className="label py-3 text-right font-bold whitespace-nowrap">
                  <span aria-hidden="true" className={`${AFFORDANCE} mr-3 hidden px-1 md:inline-block`}>[+] View dossier</span>
                  {item.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
