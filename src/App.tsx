import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { ComponentsView } from "~/components/components-view"
import { DesignView } from "~/components/design-view"
import { GsapView } from "~/components/gsap-view"
import { InspirationView } from "~/components/inspiration-view"
import { ENTRIES, hasDemo } from "~/demos"
import design from "~/data/design.json"

const TABS = [
  { id: "components", label: "Components", count: ENTRIES.filter(hasDemo).length },
  { id: "gsap", label: "GSAP & motion", count: Object.keys(import.meta.glob("./gsap-demos/*.tsx")).length + design.motion.length },
  { id: "design", label: "Design data", count: design.palettes.length + design.fonts.length + design.styles.length },
  { id: "inspiration", label: "Inspiration", count: Object.keys(import.meta.glob("../../Awward_Website_Examples/*/README.md")).length },
] as const
type Tab = (typeof TABS)[number]["id"]

const fromHash = (): Tab => {
  const h = location.hash.slice(1)
  return (TABS.some((t) => t.id === h) ? h : "components") as Tab
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>(fromHash)
  useEffect(() => {
    const on = () => setTab(fromHash())
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] items-center gap-4 px-4 pt-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">UI Reference</h1>
            <p className="truncate text-xs text-muted-foreground">
              Live demos from Magic UI · Cult UI · UI Layouts · shadcn/ui · GSAP · ui-ux-pro-max. Every card names its source.
            </p>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1800px] gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Sections">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              aria-current={tab === t.id ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors ${
                tab === t.id ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label} <span className="text-xs text-muted-foreground">{t.count}</span>
            </a>
          ))}
        </nav>
      </header>

      <main>
        {tab === "components" && <ComponentsView />}
        {tab === "gsap" && <GsapView />}
        {tab === "design" && <DesignView />}
        {tab === "inspiration" && <InspirationView />}
      </main>
    </>
  )
}
