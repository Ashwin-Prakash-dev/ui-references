import { useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"

import design from "~/data/design.json"
import { LibBadge } from "~/components/lib-badge"

type Palette = (typeof design.palettes)[number]
type Font = (typeof design.fonts)[number]

function Swatch({ name, hex }: { name: string; hex: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      title={`${name} ${hex} (click to copy)`}
      onClick={() => {
        navigator.clipboard.writeText(hex)
        setDone(true)
        setTimeout(() => setDone(false), 900)
      }}
      className="group flex flex-col items-start gap-1"
    >
      <span className="flex h-9 w-full items-center justify-center rounded-md ring-1 ring-inset ring-black/10" style={{ background: hex }}>
        {done && <Check className="size-3.5 mix-blend-difference" color="white" />}
      </span>
      <span className="text-[10px] leading-none text-muted-foreground">{name}</span>
      <span className="font-mono text-[10px] leading-none text-foreground/80">{hex}</span>
    </button>
  )
}

function PaletteCard({ p }: { p: Palette }) {
  const c = p.colors as Record<string, string>
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      {/* mini mock-up in the palette's own roles */}
      <div className="rounded-lg p-3" style={{ background: c.Background, color: c.Foreground, border: `1px solid ${c.Border}` }}>
        <div className="rounded-md p-3" style={{ background: c.Card, border: `1px solid ${c.Border}` }}>
          <p className="text-[13px] font-semibold">{p.name}</p>
          <p className="mt-0.5 text-[11px] opacity-70">Muted supporting copy</p>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="rounded px-2 py-1 text-[11px] font-medium text-white" style={{ background: c.Primary }}>Primary</span>
            <span className="rounded px-2 py-1 text-[11px] font-medium" style={{ background: c.Accent, color: "#000" }}>Accent</span>
            <span className="rounded px-2 py-1 text-[11px]" style={{ background: c.Muted }}>Muted</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(c).map(([k, v]) => (
          <Swatch key={k} name={k} hex={v} />
        ))}
      </div>
      {p.notes && <p className="text-[11px] text-muted-foreground">{p.notes}</p>}
    </article>
  )
}

const loaded = new Set<string>()
function FontCard({ f }: { f: Font }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    // Load each pairing's Google Fonts stylesheet only when its card comes into view.
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || loaded.has(f.url) || !f.url.startsWith("http")) return
      loaded.add(f.url)
      const l = document.createElement("link")
      l.rel = "stylesheet"
      l.href = f.url
      document.head.appendChild(l)
    }, { rootMargin: "400px" })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [f.url])
  return (
    <article ref={ref} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.name} · {f.category}</span>
        <LibBadge lib="ui-ux-pro-max" label="ui-ux-pro-max" />
      </div>
      <p className="text-3xl leading-tight" style={{ fontFamily: `'${f.heading}', serif`, fontWeight: 600 }}>The quick brown fox</p>
      <p className="text-[14px] leading-relaxed text-foreground/85" style={{ fontFamily: `'${f.body}', sans-serif` }}>
        Body copy in {f.body}: good typography pairs a distinctive heading with a readable body face.
      </p>
      <p className="font-mono text-[11px] text-muted-foreground">heading: {f.heading} · body: {f.body}</p>
      <p className="text-[12px] text-muted-foreground"><span className="text-foreground">Mood:</span> {f.mood}</p>
      <p className="text-[12px] text-muted-foreground"><span className="text-foreground">Best for:</span> {f.bestFor}</p>
    </article>
  )
}

export function DesignView() {
  const [tab, setTab] = useState<"palettes" | "fonts" | "styles">("palettes")
  const [q, setQ] = useState("")
  const t = q.toLowerCase()
  const palettes = design.palettes.filter((p) => `${p.name} ${p.notes}`.toLowerCase().includes(t))
  const fonts = design.fonts.filter((f) => `${f.name} ${f.heading} ${f.body} ${f.mood} ${f.bestFor}`.toLowerCase().includes(t))
  const styles = design.styles.filter((s) => `${s.name} ${s.keywords} ${s.bestFor}`.toLowerCase().includes(t))

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-24 pt-8 sm:px-6">
      <h2 className="text-2xl font-semibold">Design data</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        From <code className="font-mono">skills/ui-ux-pro-max/data</code>: product palettes (click a swatch to copy its hex), font pairings rendered in their real fonts, and the style catalogue.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {([["palettes", `Palettes (${design.palettes.length})`], ["fonts", `Font pairings (${design.fonts.length})`], ["styles", `Styles (${design.styles.length})`]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-full border px-3 py-1.5 text-sm ${tab === k ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className="ml-auto h-9 w-56 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring" />
      </div>

      {tab === "palettes" && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1700px]:grid-cols-4">
          {palettes.map((p) => <PaletteCard key={p.name} p={p} />)}
        </div>
      )}
      {tab === "fonts" && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fonts.map((f) => <FontCard key={f.name} f={f} />)}
        </div>
      )}
      {tab === "styles" && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {styles.map((s) => (
            <article key={s.name} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold">{s.name}</h3>
                <LibBadge lib="ui-ux-pro-max" label="ui-ux-pro-max" />
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">{[s.id, s.era, s.complexity && `complexity: ${s.complexity}`].filter(Boolean).join(" · ")}</p>
              <p className="text-[12px] text-muted-foreground"><span className="text-foreground">Keywords:</span> {s.keywords}</p>
              <p className="text-[12px] text-muted-foreground"><span className="text-foreground">Colors:</span> {s.colors}</p>
              <p className="text-[12px] text-muted-foreground"><span className="text-foreground">Effects:</span> {s.effects}</p>
              <p className="text-[12px] text-muted-foreground"><span className="text-foreground">Best for:</span> {s.bestFor}</p>
              <p className="text-[12px] text-muted-foreground"><span className="text-foreground">Avoid for:</span> {s.avoid}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
