import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import GarmentFrame, { fitRegion } from './GarmentFrame.jsx'
import { brandOf } from '../data/capsule.js'

const VIEWS = [
  { key: 'front', label: '[Front]', telemetry: 'Front seam flat_sketch' },
  { key: 'back', label: '[Back]', telemetry: 'Back seam flat_sketch' },
  { key: 'sheet', label: '[Blueprint CAD]', telemetry: 'Front/back seam flat_sketch' },
]

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Clip the full-screen layer down to an element's on-screen box. Off-screen (or missing)
// origins collapse to a horizontal slit through the middle of the viewport instead.
function insetFor(el) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const r = el?.getBoundingClientRect()
  if (!r || r.bottom <= 0 || r.top >= vh) return `inset(${vh / 2}px 0px ${vh / 2}px 0px)`
  const t = Math.max(0, r.top)
  const b = Math.max(0, vh - r.bottom)
  return `inset(${t}px ${Math.max(0, vw - r.right)}px ${b}px ${Math.max(0, r.left)}px)`
}

function Ruler({ ink }) {
  const tick = (w, step) => `linear-gradient(to bottom, ${ink} 1px, transparent 1px) right top / ${w}px ${step}% repeat-y`
  return (
    <div aria-hidden="true" className="absolute inset-y-0 right-0 w-10">
      <div className="absolute inset-y-0 right-0 w-4" style={{ background: [tick(16, 10), tick(10, 5), tick(5, 1)].join(', ') }} />
      {Array.from({ length: 11 }, (_, i) => (
        <span
          key={i}
          className="absolute right-5 font-mono text-[10px] leading-none"
          style={{ top: `${i * 10}%`, transform: `translateY(${i === 0 ? 0 : i === 10 ? -100 : -50}%)` }}
        >
          {i * 10}
        </span>
      ))}
    </div>
  )
}

function Canvas({ item, view }) {
  const s = item.sheet
  const ink = s?.ink ?? '#000000'
  const zoom = s ? fitRegion(s.views[view] ?? s.views.sheet, 1, s.aspect).scale : 1
  const telemetry = VIEWS.find((v) => v.key === view).telemetry
  const corners = (
    // Each readout sits on a chip of the sheet's own ground so it stays legible over any garment.
    <div
      aria-hidden="true"
      className="label pointer-events-none absolute inset-0 text-[10px] [&>p]:px-1"
      style={{ color: ink, '--chip': `color-mix(in srgb, ${s?.ground ?? '#FFFFFF'} 85%, transparent)` }}
    >
      <p className="absolute top-3 left-3 max-w-[calc(50%-2rem)] bg-(--chip)">Fabric: {item.gsm}gsm {item.category}</p>
      <p className="absolute top-3 right-12 max-w-[calc(50%-2rem)] bg-(--chip) text-right">Fit: raw industrial / {item.fitTag}</p>
      <p className="absolute bottom-3 left-3 bg-(--chip)">{s ? telemetry : 'No flat on file'}</p>
      <p className="absolute right-12 bottom-3 bg-(--chip) text-right">{s ? `Zoom ×${zoom.toFixed(2)}` : 'Archive piece'}</p>
    </div>
  )
  // Graph paper sits over the sheet like a light-table overlay, so opaque grounds stay seamless.
  const grid = (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        '--ink': ink,
        backgroundImage: [
          'linear-gradient(to right, color-mix(in srgb, var(--ink) 22%, transparent) 1px, transparent 1px)',
          'linear-gradient(to bottom, color-mix(in srgb, var(--ink) 22%, transparent) 1px, transparent 1px)',
          'linear-gradient(to right, color-mix(in srgb, var(--ink) 7%, transparent) 1px, transparent 1px)',
          'linear-gradient(to bottom, color-mix(in srgb, var(--ink) 7%, transparent) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '10% 10%, 10% 10%, 1% 1%, 1% 1%',
      }}
    />
  )

  return (
    <div id="dossier-canvas" role="tabpanel" aria-labelledby={`dossier-tab-${view}`} className="relative border-2 border-ink">
      {s ? (
        <GarmentFrame sheet={s} view={view} aspect={1} animate hd alt={`${item.name} flat sketch sheet, ${view === 'sheet' ? 'full sheet' : `${view} view`}`}>
          {grid}
          <Ruler ink={ink} />
          {corners}
        </GarmentFrame>
      ) : (
        <div className="relative flex aspect-square items-center justify-center bg-paper">
          {grid}
          <Ruler ink={ink} />
          {corners}
          <p className="label relative font-bold">No flat on file // archive piece</p>
        </div>
      )}
    </div>
  )
}

function ViewSwitcher({ view, setView, available }) {
  const tabs = useRef([])
  const onKeyDown = (e) => {
    const usable = VIEWS.map((v, n) => n).filter((n) => available(VIEWS[n].key))
    const i = usable.indexOf(VIEWS.findIndex((v) => v.key === view))
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: usable.length - 1 }[e.key]
    if (next === undefined || !usable.length) return
    e.preventDefault()
    const n = usable[(next + usable.length) % usable.length]
    setView(VIEWS[n].key)
    tabs.current[n]?.focus()
  }
  return (
    <div role="tablist" aria-label="Garment view" className="pill mt-4 inline-flex border-2 border-ink bg-signal p-1" onKeyDown={onKeyDown}>
      {VIEWS.map((v, n) => {
        const selected = v.key === view
        return (
          <button
            key={v.key}
            ref={(el) => (tabs.current[n] = el)}
            id={`dossier-tab-${v.key}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls="dossier-canvas"
            tabIndex={selected ? 0 : -1}
            disabled={!available(v.key)}
            onClick={() => setView(v.key)}
            className={`pill label cursor-pointer px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-60 md:px-4 ${selected ? 'bg-ink text-signal' : 'text-ink hover:bg-ink/10'}`}
          >
            {v.label}
          </button>
        )
      })}
    </div>
  )
}

function Crosshair({ className }) {
  return (
    <span aria-hidden="true" className={`absolute size-4 ${className}`}>
      <span className="absolute inset-x-0 top-1/2 h-px bg-paper/30" />
      <span className="absolute inset-y-0 left-1/2 w-px bg-paper/30" />
    </span>
  )
}

// Full-screen Garment Spec Dossier. A stepped clip-path shutter opens it out of (and closes it
// back into) whatever card or row launched it; the page underneath never scrolls.
export default function Dossier({ item, origin, closing, onRequestClose, onClosed }) {
  const root = useRef(null)
  const title = useRef(null)
  const [view, setView] = useState('front')
  const house = brandOf(item)
  const box = () => origin?.closest('[data-dossier-origin]') ?? origin

  useGSAP(
    () => {
      title.current.focus({ preventScroll: true })
      if (reducedMotion()) return
      // Words keep long garment names from breaking mid-word; chars do the slam.
      const split = SplitText.create(title.current, { type: 'words,chars', mask: 'chars' })
      gsap
        .timeline()
        .fromTo(root.current, { clipPath: insetFor(box()) }, { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.5, ease: 'steps(6)' })
        .from('[data-d-meta]', { autoAlpha: 0, duration: 0.3, ease: 'steps(3)', stagger: 0.05 })
        .from(split.chars, { yPercent: 110, duration: 0.7, ease: 'expo.out', stagger: 0.012 }, '<')
        .from('[data-d-block]', { opacity: 0, duration: 0.2, ease: 'steps(2)', stagger: 0.05 }, '<0.1')
        .from('[data-d-mark]', { yPercent: 40, opacity: 0, duration: 0.5, ease: 'expo.out' }, '<0.2')
    },
    { scope: root },
  )

  // Shutter back into the origin, then unmount.
  useGSAP(
    () => {
      if (!closing) return
      if (reducedMotion()) return onClosed()
      gsap.to(root.current, { clipPath: insetFor(box()), duration: 0.3, ease: 'steps(4)', onComplete: onClosed })
    },
    { dependencies: [closing], scope: root },
  )

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onRequestClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onRequestClose])

  const close = (
    <button type="button" onClick={onRequestClose} className="label cursor-pointer border-2 border-ink px-3 py-2 font-bold hover:bg-ink hover:text-paper">
      [← Close dossier]
    </button>
  )

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-title"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-paper text-ink"
    >
      <header data-d-meta className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b-2 border-ink px-4 py-3 md:px-8">
        <div className="justify-self-start">{close}</div>
        <p className="label text-center font-bold">Capsule 001 — madebymannie</p>
        <div className="hidden justify-self-end md:block">{close}</div>
      </header>

      <div className="px-4 pt-6 pb-10 md:px-8">
        <p className="mb-3 inline-flex items-baseline gap-3 border-2 border-ink px-3 py-1" data-d-meta>
          <span className="label">House {house.no}</span>
          <span className="font-display text-2xl leading-none font-bold tracking-[-0.04em] uppercase md:text-3xl">{house.name}</span>
        </p>
        <h2
          id="dossier-title"
          ref={title}
          tabIndex={-1}
          className="font-display text-[11vw] leading-[0.85] font-bold tracking-[-0.05em] uppercase outline-none md:text-[min(4.6vw,7.5svh)]"
        >
          Detailed breakdown <span className="text-signal">[{item.name}]</span>
        </h2>

        <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-[auto_1fr]">
          <div className="w-full min-w-0 md:w-[min(54svh,46vw)]">
            <Canvas item={item} view={view} />
            <ViewSwitcher view={view} setView={setView} available={(key) => Boolean(item.sheet?.views[key])} />
          </div>

          <aside aria-label="Specification telemetry" className="@container relative flex min-w-0 flex-col bg-ink p-6 text-paper md:p-10">
            <Crosshair className="top-3 left-3" />
            <Crosshair className="top-3 right-3" />
            <Crosshair className="bottom-3 left-3" />
            <Crosshair className="right-3 bottom-3" />

            <p data-d-block className="label font-bold text-paper/70">
              Fabrication // Archive no. {item.id}
            </p>
            <dl className="mt-4">
              {[
                ['Material', item.fabric],
                ['Treatment', item.treatment],
                ['Seams', item.seams],
                ['Fit // Colourway // Sizes', `${item.fit} // ${item.colourway} // ${item.sizes}`],
              ].map(([k, v]) => (
                <div key={k} data-d-block className="border-t border-paper/30 py-3 md:py-4">
                  <dt className="label text-paper/70">{k}</dt>
                  <dd className="mt-1 font-mono text-sm leading-snug font-bold uppercase md:text-base">{v}</dd>
                </div>
              ))}
            </dl>
            <p data-d-block className="label mt-4 font-bold text-signal">
              [Status: {item.status} // Not for sale]
            </p>
            {item.note && (
              <p data-d-block className="label mt-2 text-paper/70">
                {item.note}
              </p>
            )}
            {/* Sized to the panel (container units), not the viewport: beside the canvas the panel is far
                narrower than the screen, so vw-based sizes clipped on tablets. */}
            <p
              data-d-mark
              aria-hidden="true"
              className="mt-10 w-full text-center font-display text-[clamp(2rem,14.5cqi,6rem)] leading-[0.8] font-bold tracking-[-0.06em] whitespace-nowrap lowercase md:mt-auto md:pt-10"
            >
              madebymannie
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
