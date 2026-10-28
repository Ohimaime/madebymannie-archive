import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

const SPEC = [
  ['Type', 'Space Grotesk / Space Mono'],
  ['Palette', '#000000 / #FFFFFF / #FF0000'],
  ['Grid', '12 col / 2px rule'],
  ['Build', 'React / Tailwind / GSAP'],
]

const CONTACT = [
  { label: 'Email', value: 'm4nnie123@gmail.com', href: 'mailto:m4nnie123@gmail.com' },
  { label: 'Phone', value: '+234 903 011 5882', href: 'tel:+2349030115882' },
  { label: 'Instagram', value: '@_madebymannie', href: 'https://www.instagram.com/_madebymannie/', external: true },
]

// Closing spec block + a wordmark cropped by the bottom of the page.
export default function Colophon() {
  const root = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // The wordmark rises into its crop as the page runs out.
        gsap.from('[data-footer-mark]', {
          yPercent: 60,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: 1 },
        })
      })
    },
    { scope: root },
  )

  return (
    <footer ref={root} aria-labelledby="colophon-heading" className="relative z-10 bg-ink text-paper">
      {/* Leads — status + direct contact, full-width rows as the hit areas */}
      <div className="grid grid-cols-4 gap-y-6 border-b-2 border-paper px-4 py-10 md:grid-cols-12 md:px-8 md:py-14">
        <div className="col-span-4 md:col-span-4">
          <p className="label">Status //</p>
          <p className="mt-2 inline-flex items-center gap-3 bg-signal px-3 py-2 font-display text-[clamp(1.5rem,4vw,2.75rem)] leading-none font-bold tracking-[-0.04em] text-ink uppercase">
            <span aria-hidden="true" className="size-3 shrink-0 bg-ink" />
            Available for commission
          </p>
        </div>
        <ul aria-label="Contact" className="col-span-4 border-t-2 border-paper md:col-span-7 md:col-start-6">
          {CONTACT.map((c) => (
            <li key={c.label} className="border-b-2 border-paper">
              <a
                href={c.href}
                {...(c.external && { target: '_blank', rel: 'noopener noreferrer' })}
                className="flex min-h-16 cursor-pointer flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 py-3 hover:bg-paper hover:text-ink md:px-3"
              >
                <span className="font-display text-[clamp(1.05rem,3.2vw,2rem)] leading-tight font-bold wrap-anywhere uppercase">
                  [{c.label}: {c.value}]
                </span>
                <span aria-hidden="true" className="label font-bold">{c.external ? '↗' : '→'}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-4 gap-y-8 border-b-2 border-paper px-4 py-10 md:grid-cols-12 md:px-8 md:py-14">
        <div className="col-span-4 md:col-span-3">
          <h2 id="colophon-heading" className="label font-bold">06 / Colophon</h2>
          <p className="label mt-2">File closed — Archive 001</p>
        </div>

        <dl className="col-span-4 md:col-span-5 md:col-start-5">
          {SPEC.map(([k, v]) => (
            <div key={k} className="grid grid-cols-2 border-b border-paper py-1 last:border-b-0">
              <dt className="label">{k}</dt>
              <dd className="label font-bold">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="col-span-4 flex flex-col items-start gap-2 md:col-span-2 md:col-start-11 md:items-end">
          <a
            href="#top"
            className="label cursor-pointer border-2 border-paper px-3 py-2 font-bold hover:bg-paper hover:text-ink"
          >
            Back to top ↑
          </a>
          <p className="label">© 2026 madebymannie</p>
        </div>
      </div>

      <div aria-hidden="true" className="overflow-hidden px-4 md:px-8">
        <p
          data-footer-mark
          className="translate-y-[22%] font-display text-[13.2vw] leading-[0.8] font-bold tracking-[-0.06em] whitespace-nowrap uppercase"
        >
          Madebymannie
        </p>
      </div>
    </footer>
  )
}
