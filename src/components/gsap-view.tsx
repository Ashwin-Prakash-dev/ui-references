import { useState, type ComponentType } from "react"
import { Code2, ExternalLink, FileCode2 } from "lucide-react"

import design from "~/data/design.json"
import { LibBadge } from "~/components/lib-badge"

declare const __ROOT__: string

type DemoModule = { default: ComponentType; meta: { title: string; skill: string; description: string } }
const demos = import.meta.glob<DemoModule>("../gsap-demos/*.tsx", { eager: true })
const codes = import.meta.glob<string>("../gsap-demos/*.tsx", { eager: true, query: "?raw", import: "default" })

function GsapCard({ path }: { path: string }) {
  const { default: Demo, meta } = demos[path]
  const [show, setShow] = useState(false)
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="stage flex h-[380px] items-center justify-center border-b border-border bg-background p-6">
        <Demo />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold">{meta.title}</h3>
          <LibBadge lib="gsap" label={`GSAP · ${meta.skill}`} />
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{meta.description}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-muted-foreground">
          <button type="button" onClick={() => setShow((s) => !s)} className="inline-flex items-center gap-1.5 hover:text-foreground">
            <Code2 className="size-3.5" /> {show ? "Hide code" : "Show code"}
          </button>
          <a href={`vscode://file/${__ROOT__}/gsap-skills/skills/${meta.skill}/SKILL.md`} className="inline-flex items-center gap-1.5 hover:text-foreground">
            <FileCode2 className="size-3.5" /> Skill notes
          </a>
          <a href="https://gsap.com/docs/v3/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
            <ExternalLink className="size-3.5" /> GSAP docs
          </a>
        </div>
        {show && (
          <pre className="code-scroll max-h-[420px] overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[11.5px] leading-relaxed">{codes[path]}</pre>
        )}
      </div>
    </article>
  )
}

export function GsapView() {
  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-24 pt-8 sm:px-6">
      <h2 className="text-2xl font-semibold">GSAP patterns</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Live, editable references for the techniques covered in <code className="font-mono">gsap-skills/skills</code>. Each card's code is the exact file that runs (React +
        <code className="font-mono"> useGSAP</code>, cleaned up automatically on unmount).
      </p>
      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 min-[1700px]:grid-cols-3">
        {Object.keys(demos).sort().map((p) => (
          <GsapCard key={p} path={p} />
        ))}
      </div>

      <h2 className="mt-16 text-2xl font-semibold">Motion presets</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Duration/easing/GSAP snippets by intensity tier, as used by the design-system generator (<code className="font-mono">--motion</code> dial).
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {design.motion.map((m, i) => (
          <article key={i} className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {m.category} <span className="font-normal text-muted-foreground">· {m.tier}</span>
              </h3>
              <LibBadge lib="ui-ux-pro-max" label="ui-ux-pro-max" />
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              trigger: {m.trigger} · {m.duration} · {m.easing}
            </p>
            <pre className="whitespace-pre-wrap break-words rounded-md bg-muted/60 p-2 font-mono text-[11px] leading-relaxed">{m.snippet}</pre>
            <p className="text-[12px] text-muted-foreground"><span className="text-foreground">Do:</span> {m.do}</p>
            <p className="text-[12px] text-muted-foreground"><span className="text-foreground">Don't:</span> {m.dont}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
