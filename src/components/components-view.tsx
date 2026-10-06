import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { Search, X } from "lucide-react"

import { DemoCard } from "~/components/demo-card"
import { ENTRIES, hasDemo, type Entry } from "~/demos"

const LIBS: { id: Entry["lib"]; label: string }[] = [
  { id: "magicui", label: "Magic UI" },
  { id: "cult-ui", label: "Cult UI" },
  { id: "uilayouts", label: "UI Layouts" },
  { id: "shadcn", label: "shadcn/ui" },
]
const KINDS: { id: Entry["kind"] | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "component", label: "Components" },
  { id: "chart", label: "Charts" },
  { id: "block", label: "Blocks / sections" },
]
const PAGE = 36

const entries = ENTRIES.filter(hasDemo)

function count<T extends string>(list: Entry[], key: (e: Entry) => T) {
  const m = new Map<T, number>()
  list.forEach((e) => m.set(key(e), (m.get(key(e)) ?? 0) + 1))
  return m
}

export function ComponentsView() {
  const [q, setQ] = useState("")
  const query = useDeferredValue(q.trim().toLowerCase())
  const [libs, setLibs] = useState<Set<string>>(new Set())
  const [kind, setKind] = useState<Entry["kind"] | "all">("all")
  const [cat, setCat] = useState<string | null>(null)
  const [shown, setShown] = useState(PAGE)
  const sentinel = useRef<HTMLDivElement>(null)

  const base = useMemo(
    () =>
      entries.filter((e) => {
        if (libs.size && !libs.has(e.lib)) return false
        if (kind !== "all" && e.kind !== kind) return false
        if (!query) return true
        const hay = `${e.title} ${e.variant} ${e.name} ${e.group} ${e.description} ${e.category} ${e.libLabel} ${e.deps.join(" ")}`.toLowerCase()
        return query.split(/\s+/).every((t) => hay.includes(t))
      }),
    [libs, kind, query]
  )
  const filtered = useMemo(() => (cat ? base.filter((e) => e.category === cat) : base), [base, cat])
  const cats = useMemo(() => [...count(base, (e) => e.category)].sort((a, b) => b[1] - a[1]), [base])
  const libCounts = useMemo(() => count(entries.filter((e) => kind === "all" || e.kind === kind), (e) => e.lib), [kind])

  useEffect(() => setShown(PAGE), [query, libs, kind, cat])
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown((n) => n + PAGE), { rootMargin: "1200px 0px" })
    if (sentinel.current) io.observe(sentinel.current)
    return () => io.disconnect()
  }, [])

  const toggleLib = (id: string) =>
    setLibs((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div className="mx-auto grid max-w-[1800px] gap-8 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[230px_1fr]">
      {/* sidebar */}
      <aside className="lg:sticky lg:top-[7.5rem] lg:max-h-[calc(100svh-8.5rem)] lg:overflow-y-auto lg:pr-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, effect, dependency…"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Clear search">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <h4 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Library</h4>
        <div className="flex flex-col gap-1">
          {LIBS.map((l) => (
            <label key={l.id} className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <span className="flex items-center gap-2">
                <input type="checkbox" checked={libs.has(l.id)} onChange={() => toggleLib(l.id)} className="accent-current" />
                {l.label}
              </span>
              <span className="text-xs text-muted-foreground">{libCounts.get(l.id) ?? 0}</span>
            </label>
          ))}
        </div>

        <h4 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type</h4>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${kind === k.id ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {k.label}
            </button>
          ))}
        </div>

        <h4 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</h4>
        <div className="flex flex-col gap-0.5">
          <button type="button" onClick={() => setCat(null)} className={`flex justify-between rounded-md px-2 py-1.5 text-left text-sm ${cat === null ? "bg-muted font-medium" : "hover:bg-muted"}`}>
            All <span className="text-xs text-muted-foreground">{base.length}</span>
          </button>
          {cats.map(([c, n]) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={`flex justify-between rounded-md px-2 py-1.5 text-left text-sm capitalize ${cat === c ? "bg-muted font-medium" : "hover:bg-muted"}`}>
              {c.replace("-", " ")} <span className="text-xs text-muted-foreground">{n}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* grid */}
      <section>
        <p className="mb-4 text-sm text-muted-foreground">
          {filtered.length} demo{filtered.length === 1 ? "" : "s"}
          {cat && <> in <span className="capitalize text-foreground">{cat.replace("-", " ")}</span></>}
        </p>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 min-[1700px]:grid-cols-3">
          {filtered.slice(0, shown).map((e) => (
            <DemoCard key={e.id} entry={e} />
          ))}
        </div>
        {filtered.length === 0 && <p className="py-20 text-center text-muted-foreground">Nothing matches. Try fewer words or clear a filter.</p>}
        <div ref={sentinel} className="h-1" />
      </section>
    </div>
  )
}
