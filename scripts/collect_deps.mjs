// Collect every bare import specifier used by the demo-reachable library source, keep the ones that resolve
// from this app's node_modules, and write them to src/data/optimize-deps.json for optimizeDeps.include.
// Pre-bundling everything up front prevents Vite from discovering a dependency mid-session and force-reloading.
// Run from ui-reference/:  node scripts/collect_deps.mjs
import fs from "node:fs"
import path from "node:path"

const APP = path.resolve(import.meta.dirname, "..")
const ROOT = path.resolve(APP, "..")
const DIRS = [
  "magicui/apps/www/registry", "magicui/apps/www/components", "magicui/apps/www/lib", "magicui/apps/www/hooks",
  "cult-ui/apps/www/registry", "cult-ui/apps/www/components", "cult-ui/apps/www/lib", "cult-ui/apps/www/hooks",
  "uilayouts/apps/ui-layout/registry", "uilayouts/apps/ui-layout/components", "uilayouts/apps/ui-layout/lib", "uilayouts/apps/ui-layout/hooks",
  "uilayouts/packages/blocks/src", "uilayouts/packages/ui/src", "uilayouts/packages/shadcn/src",
  "Shadcnui/apps/v4/registry/new-york-v4", "Shadcnui/apps/v4/hooks", "Shadcnui/apps/v4/lib",
  "ui-reference/src",
]
const SKIP = /^(next|geist|server-only|react|react-dom)(\/|$)|^@\/|^@repo\/|^~\/|^#|^node:|^@app\//
const valid = /^(@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*(\/[a-zA-Z0-9._~/-]+)?$/

const specs = new Set(["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"])
const walk = (d) => {
  if (!fs.existsSync(d)) return
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (e.name !== "node_modules" && !e.name.startsWith(".")) walk(p) }
    else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) {
      const t = fs.readFileSync(p, "utf8")
      for (const m of t.matchAll(/(?:from\s*|import\s*\(\s*|import\s+)["']([^"'\n]+)["']/g)) {
        const s = m[1]
        if (s.startsWith(".") || s.startsWith("/") || SKIP.test(s) || !valid.test(s) || s.endsWith(".css")) continue
        specs.add(s)
      }
    }
  }
}
DIRS.forEach((d) => walk(path.join(ROOT, d)))

const ok = []
const bad = []
for (const s of [...specs].sort()) {
  try {
    import.meta.resolve(s, `file:///${APP.replace(/\\/g, "/")}/src/main.tsx`)
    // import.meta.resolve doesn't check existence for packages without "exports": verify on disk.
    const pkg = s.startsWith("@") ? s.split("/").slice(0, 2).join("/") : s.split("/")[0]
    if (!fs.existsSync(path.join(APP, "node_modules", pkg, "package.json"))) throw new Error("not installed")
    ok.push(s)
  } catch (e) {
    bad.push(`${s} (${e.message.split("\n")[0].slice(0, 60)})`)
  }
}
fs.writeFileSync(path.join(APP, "src/data/optimize-deps.json"), JSON.stringify(ok, null, 1))
console.log(`${ok.length} specifiers to pre-bundle; ${bad.length} skipped:`)
console.log(bad.join("\n"))
