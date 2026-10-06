import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react"
import { Check, Code2, Copy, ExternalLink, FileCode2, RotateCw } from "lucide-react"

import { getDemo, loadSource, resetDemo, type Entry } from "~/demos"
import { LibBadge } from "~/components/lib-badge"

declare const __ROOT__: string

/* ---------- error boundary: one broken demo stays on its own card ---------- */
class Boundary extends Component<{ onError: (m: string) => void; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error) {
    this.props.onError(error.message)
  }
  render() {
    if (this.state.error) {
      // Building blocks registered without a demo fail on missing props/refs/providers: say that plainly.
      const needsProps = /reading '|not iterable|must be used within|is not a function|is undefined/i.test(this.state.error.message)
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            {needsProps ? "Building block: needs props or a parent component to render" : "This demo can't run in the gallery"}
          </p>
          <p className="max-w-md break-words font-mono text-xs text-muted-foreground">{this.state.error.message.slice(0, 220)}</p>
          <p className="text-xs text-muted-foreground">The code and install command below still apply.</p>
        </div>
      )
    }
    return this.props.children
  }
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady])
  return null
}

/* ---------- full-page blocks render in a 1280px virtual viewport, scaled to the card ---------- */
function ScaledFrame({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const W = 1280
  const H = 800
  useEffect(() => {
    const el = outer.current!
    const ro = new ResizeObserver(() => setScale(el.clientWidth / W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={outer} className="relative w-full" style={{ height: H * scale }}>
      <div className="stage absolute left-0 top-0 overflow-auto bg-background" style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        {children}
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1200)
      }}
      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Copy install command"
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

export function DemoCard({ entry }: { entry: Entry }) {
  const ref = useRef<HTMLElement>(null)
  const [near, setNear] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle")
  const [attempt, setAttempt] = useState(0)
  const [code, setCode] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const wide = entry.kind === "block"

  // Mount when near the viewport, unmount when far away (frees WebGL contexts, timers, listeners).
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "700px 0px" })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (near && status === "idle") setStatus("loading")
  }, [near, status])

  const Demo = getDemo(entry)
  const preview = (
    <Boundary key={attempt} onError={() => setStatus("error")}>
      <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted/40" />}>
        <Demo />
        <Ready onReady={() => setStatus((s) => (s === "error" ? s : "ok"))} />
      </Suspense>
    </Boundary>
  )

  const vscode = (p: string) => `vscode://file/${__ROOT__}/${p}`

  return (
    <article
      ref={ref}
      data-id={entry.id}
      data-status={status}
      className={`flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card ${wide ? "col-span-full" : ""}`}
    >
      {/* preview */}
      <div className="border-b border-border bg-background">
        {near ? (
          wide ? (
            <ScaledFrame>{preview}</ScaledFrame>
          ) : (
            <div className="stage h-[380px]">
              <div className="flex h-full w-full items-center justify-center overflow-auto p-4">{preview}</div>
            </div>
          )
        ) : (
          <div className={wide ? "aspect-[16/10]" : "h-[380px]"} />
        )}
      </div>

      {/* meta */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-card-foreground">
              {entry.title}
              {entry.variant && <span className="font-normal text-muted-foreground"> · {entry.variant}</span>}
            </h3>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{entry.name}</p>
          </div>
          <LibBadge lib={entry.lib} label={entry.libLabel} />
        </div>

        {entry.description && <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{entry.description}</p>}

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">{entry.category}</span>
          {entry.deps.slice(0, 6).map((d) => (
            <span key={d} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              {d}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-1 rounded-lg border border-border bg-muted/40 py-1 pl-3 pr-1">
          <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-foreground/85" title={entry.install}>
            {entry.install}
          </code>
          <CopyButton text={entry.install} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
          <button
            type="button"
            onClick={async () => {
              if (code === null) setCode(await loadSource(entry))
              setShowCode((v) => !v)
            }}
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Code2 className="size-3.5" /> {showCode ? "Hide code" : "Show code"}
          </button>
          <a href={vscode(entry.demo)} className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground" title={entry.demo}>
            <FileCode2 className="size-3.5" /> Demo file
          </a>
          {entry.source !== entry.demo && (
            <a href={vscode(entry.source)} className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground" title={entry.source}>
              <FileCode2 className="size-3.5" /> Component source
            </a>
          )}
          <a href={entry.docs} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
            <ExternalLink className="size-3.5" /> Docs
          </a>
          <button
            type="button"
            onClick={() => {
              resetDemo(entry)
              setStatus("loading")
              setAttempt((a) => a + 1)
            }}
            className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Reload demo"
          >
            <RotateCw className="size-3.5" />
          </button>
        </div>

        {showCode && code !== null && (
          <pre className="code-scroll max-h-[420px] overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[11.5px] leading-relaxed text-foreground/90">
            {code}
          </pre>
        )}
      </div>
    </article>
  )
}
