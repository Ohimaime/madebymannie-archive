import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

// Fit a crop box ([x0, y0, x1, y1] in % of the sheet) inside a frame of `frameAspect` (w / h).
// The stage is the full sheet at frame width, scaled from its top-left corner, so the result is a
// pure transform: translate(xPercent, yPercent) scale(scale).
export function fitRegion(box, frameAspect, sheetAspect, pad = 0.86) {
  const [x0, y0, x1, y1] = box.map((v) => v / 100)
  const w = x1 - x0
  const h = (y1 - y0) / sheetAspect // in frame-width units
  const scale = Math.min(1 / w, 1 / frameAspect / h) * pad
  const cx = ((x0 + x1) / 2) * scale
  const cy = ((y0 + y1) / 2 / sheetAspect) * scale
  return {
    scale,
    xPercent: (0.5 - cx) * 100,
    yPercent: (1 / frameAspect / 2 - cy) * sheetAspect * 100,
  }
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// FRONT / BACK clip the sheet to the garment's box (plus a margin) so neighbouring views on the
// same sheet don't bleed into the frame; the full-sheet view only applies the sheet's own `clip`.
// Sheets whose views physically overlap opt out with `isolate: false`.
function clipFor(sheet, view, margin = 1.5) {
  const base = sheet.clip ?? [0, 0, 0, 0]
  const box = view === 'sheet' || sheet.isolate === false ? null : sheet.views[view]
  const sides = box
    ? [box[1] - margin, 100 - box[2] - margin, 100 - box[3] - margin, box[0] - margin].map((v, i) => Math.max(v, base[i], 0))
    : base
  return `inset(${sides.map((v) => `${v}%`).join(' ')})`
}

export default function GarmentFrame({ sheet, view = 'sheet', aspect = 1, alt, animate = false, hd = false, loading, className = '', children }) {
  const stage = useRef(null)
  // Show the (already cached) 1200px sheet at once; swap to the 2400px one only after it has
  // downloaded and decoded, so the upgrade never flashes. Same box, so nothing moves.
  const [src, setSrc] = useState(sheet.src)
  useEffect(() => {
    setSrc(sheet.src)
    if (!hd || !sheet.hd) return
    let live = true
    const img = new Image()
    img.src = sheet.hd
    img.decode().then(() => live && setSrc(sheet.hd), () => {})
    return () => {
      live = false
    }
  }, [hd, sheet])

  useGSAP(
    () => {
      const shown = sheet.views[view] ? view : 'sheet'
      const to = { ...fitRegion(sheet.views[shown], aspect, sheet.aspect), clipPath: clipFor(sheet, shown) }
      if (animate && !reducedMotion()) {
        gsap.to(stage.current, { ...to, duration: 0.8, ease: 'power3.inOut', overwrite: true })
      } else {
        gsap.set(stage.current, to)
      }
    },
    { dependencies: [sheet, view, aspect] },
  )

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: aspect, background: sheet.ground, color: sheet.ink }}
    >
      <div
        ref={stage}
        className="absolute top-0 left-0 w-full origin-top-left"
        style={{ aspectRatio: sheet.aspect }}
      >
        <img src={src} alt={alt} loading={loading} decoding="async" draggable="false" className="block size-full" />
      </div>
      {children}
    </div>
  )
}
