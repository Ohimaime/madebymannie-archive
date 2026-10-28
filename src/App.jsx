import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { useGSAP } from '@gsap/react'
import GridOverlay from './components/GridOverlay.jsx'
import Hero from './components/Hero.jsx'
import Bio from './components/Bio.jsx'
import Manifesto from './components/Manifesto.jsx'
import Ticker from './components/Ticker.jsx'
import Index from './components/Index.jsx'
import Colophon from './components/Colophon.jsx'
import Dossier from './components/Dossier.jsx'
import { CAPSULE } from './data/capsule.js'
import { DossierContext } from './dossierContext.js'
import { ArchiveContext } from './archiveContext.js'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, ScrollToPlugin)

const idFromHash = () => /^#dossier-(\d{3})$/.exec(window.location.hash)?.[1] ?? null
const triggerFor = (id) => document.querySelector(`[data-dossier-trigger="${id}"]`)

export default function App() {
  // { id, closing } — `closing` lets the dossier run its exit shutter before unmounting.
  const [dossier, setDossier] = useState(null)
  const origin = useRef(null)
  const [filter, setFilter] = useState('all')
  const filterRef = useRef(filter)
  filterRef.current = filter

  // Slate buttons: filter, then glide down to the index and hand keyboard focus to it.
  // A filter change makes the index re-measure (ScrollTrigger.refresh), and a refresh restores
  // the scroll position — which would cancel a scroll already in flight. So the jump waits for it.
  const showHouse = useCallback((key) => {
    const jump = () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      gsap.to(window, { scrollTo: { y: '#index', autoKill: true }, duration: reduce ? 0 : 1.2, ease: 'power3.inOut' })
      document.getElementById('index-heading')?.focus({ preventScroll: true })
    }
    if (key === filterRef.current) return jump()
    const afterRefresh = () => {
      ScrollTrigger.removeEventListener('refresh', afterRefresh)
      jump()
    }
    ScrollTrigger.addEventListener('refresh', afterRefresh)
    setFilter(key)
  }, [])

  const open = useCallback((id, el) => {
    origin.current = el
    window.history.pushState({ dossier: id }, '', `#dossier-${id}`)
    setDossier({ id, closing: false })
  }, [])

  // Closing goes through history when we pushed the entry, so Back and the close button agree.
  const requestClose = useCallback(() => {
    if (window.history.state?.dossier) window.history.back()
    else setDossier((d) => d && { ...d, closing: true })
  }, [])

  const onClosed = useCallback(() => {
    setDossier(null)
    if (idFromHash()) window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [])

  // Pin start/end depend on text metrics: re-measure once fonts settle, and again whenever a
  // late face (e.g. a house font first shown by a filter) finishes loading.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    document.fonts.ready.then(refresh)
    document.fonts.addEventListener('loadingdone', refresh)
    return () => document.fonts.removeEventListener('loadingdone', refresh)
  }, [])

  // Deep links (#dossier-001) and Back / Forward.
  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    const sync = () => {
      const id = idFromHash()
      if (!id) return setDossier((d) => d && { ...d, closing: true })
      if (origin.current?.dataset.dossierTrigger !== id) origin.current = triggerFor(id)
      setDossier((d) => (d?.id === id && !d.closing ? d : { id, closing: false }))
    }
    if (idFromHash()) sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  // Lock page scroll underneath; the scroll position is never touched, so closing lands exactly where you were.
  // Focus goes back to the launching card / row only after `inert` is lifted (an inert element can't take focus).
  const isOpen = Boolean(dossier)
  useEffect(() => {
    document.documentElement.classList.toggle('dossier-open', isOpen)
    if (!isOpen) origin.current?.focus({ preventScroll: true })
  }, [isOpen])

  const item = dossier && CAPSULE.find((i) => i.id === dossier.id)

  return (
    <DossierContext.Provider value={{ open }}>
      <ArchiveContext.Provider value={{ filter, setFilter, showHouse }}>
        <div inert={Boolean(dossier)}>
          <GridOverlay />
          <main className="relative">
            <Hero />
            <Bio />
            <Manifesto />
            <Ticker />
            <Index />
          </main>
          <Colophon />
        </div>
      </ArchiveContext.Provider>
      {item && (
        <Dossier
          key={item.id}
          item={item}
          origin={origin.current}
          closing={dossier.closing}
          onRequestClose={requestClose}
          onClosed={onClosed}
        />
      )}
    </DossierContext.Provider>
  )
}

// Dev-only handle so headless verification can drive the GSAP ticker.
if (import.meta.env.DEV) window.gsap = gsap
