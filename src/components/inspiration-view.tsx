import { FileCode2 } from "lucide-react"

import { LibBadge } from "~/components/lib-badge"

declare const __ROOT__: string

const readmes = import.meta.glob<string>("../../../Awward_Website_Examples/*/README.md", { eager: true, query: "?raw", import: "default" })

function summary(md: string) {
  const lines = md.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("![") && !l.startsWith("```"))
  return lines.slice(0, 6).join(" ").slice(0, 600)
}

export function InspirationView() {
  const sites = Object.entries(readmes).map(([p, md]) => ({ name: p.split("/").at(-2)!, md }))
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-8 sm:px-6">
      <h2 className="text-2xl font-semibold">Awwwards-style reference sites</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Full sites in <code className="font-mono">Awward_Website_Examples/</code>. They are complete apps, so run them on their own to study structure and motion.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {sites.map((s) => (
          <article key={s.name} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-mono text-lg font-semibold">{s.name}</h3>
              <LibBadge lib="awwwards" label="Awwwards example" />
            </div>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{summary(s.md)}</p>
            <pre className="rounded-lg border border-border bg-background p-3 font-mono text-[12px]">cd Awward_Website_Examples/{s.name}{"\n"}npm run dev</pre>
            <a href={`vscode://file/${__ROOT__}/Awward_Website_Examples/${s.name}/README.md`} className="inline-flex w-fit items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
              <FileCode2 className="size-3.5" /> Open README
            </a>
          </article>
        ))}
      </div>
    </div>
  )
}
