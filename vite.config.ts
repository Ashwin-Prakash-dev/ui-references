import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"
import fs from "node:fs"

const APP = import.meta.dirname
const ROOT = path.resolve(APP, "..") // MeckyTest: the library repos live here
const abs = (p: string) => path.resolve(ROOT, p).replace(/\\/g, "/")
const shim = (f: string) => path.resolve(APP, "src/shims", f)
const OPTIMIZE: string[] = JSON.parse(fs.readFileSync(path.resolve(APP, "src/data/optimize-deps.json"), "utf8"))

/**
 * Each library repo maps "@/..." to its own app folder (and uilayouts adds "@repo/*" and "#*").
 * Pick the mapping from the importing file's location, exactly as each repo's tsconfig does.
 * Bare imports from repo files resolve from this app's node_modules (the repos have no installs).
 * Anything that still can't be resolved becomes a stub that throws when used, so one broken demo
 * shows an error on its own card instead of breaking the build.
 */
const REPOS: { dir: string; at: Record<string, string> }[] = [
  {
    dir: "uilayouts/packages/blocks",
    at: { "@/": "uilayouts/apps/ui-layout/", "#": "uilayouts/packages/blocks/src/" },
  },
  { dir: "uilayouts/packages/ui", at: { "@/": "uilayouts/apps/ui-layout/", "#": "uilayouts/packages/ui/src/" } },
  { dir: "uilayouts/packages/shadcn", at: { "@/": "uilayouts/apps/ui-layout/", "#": "uilayouts/packages/shadcn/src/" } },
  { dir: "uilayouts/apps/ui-layout", at: { "@/": "uilayouts/apps/ui-layout/" } },
  { dir: "magicui/apps/www", at: { "@/": "magicui/apps/www/" } },
  { dir: "cult-ui/apps/www", at: { "@/": "cult-ui/apps/www/" } },
  { dir: "Shadcnui/apps/v4", at: { "@/": "Shadcnui/apps/v4/" } },
].map((r) => ({ dir: abs(r.dir) + "/", at: Object.fromEntries(Object.entries(r.at).map(([k, v]) => [k, abs(v) + "/"])) }))

const WORKSPACE: Record<string, string> = {
  "@repo/ui": "uilayouts/packages/ui/src",
  "@repo/blocks": "uilayouts/packages/blocks/src",
  "@repo/shadcn": "uilayouts/packages/shadcn/src",
}

const EXT = ["", ".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts", "/index.js"]
function probe(base: string) {
  for (const e of EXT) {
    const f = base + e
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f
  }
  return null
}

const MISSING = "\0missing:"

function crossRepoResolver(): Plugin {
  const entry = path.resolve(APP, "src/main.tsx")
  return {
    name: "cross-repo-resolver",
    enforce: "pre",
    async resolveId(source, importer) {
      if (!importer || source.startsWith("\0")) return null
      const imp = importer.replace(/\\/g, "/").split("?")[0]
      const repo = REPOS.find((r) => imp.startsWith(r.dir))

      for (const [k, v] of Object.entries(WORKSPACE)) {
        if (source === k || source.startsWith(k + "/")) {
          return probe(abs(v) + source.slice(k.length)) ?? MISSING + source
        }
      }
      if (repo) {
        for (const [prefix, target] of Object.entries(repo.at)) {
          if (source.startsWith(prefix)) return probe(target + source.slice(prefix.length)) ?? MISSING + source
        }
      }
      const bare = !source.startsWith(".") && !source.startsWith("/") && !/^[a-zA-Z]:/.test(source)
      if (bare && repo) {
        const r = await this.resolve(source, entry, { skipSelf: true })
        return r ?? MISSING + source
      }
      return null
    },
    load(id) {
      if (!id.startsWith(MISSING)) return null
      const name = id.slice(MISSING.length)
      // A callable, indexable stand-in: rendering anything from it throws a readable error on that card only.
      return `const fail = () => { throw new Error("Module not available in the gallery: ${name}") };
const stub = new Proxy(fail, { get: (_t, k) => (k === "then" ? undefined : k === Symbol.toPrimitive ? () => "" : stub), apply: fail, construct: fail });
export default stub;`
    },
  }
}

/**
 * Demos reference images/videos from their own site's public/ folder ("/profile.jpg"). Serve a missing static path
 * from whichever library's public folder has it (first match wins).
 */
function libraryPublicDirs(): Plugin {
  const dirs = ["uilayouts/apps/ui-layout/public", "magicui/apps/www/public", "cult-ui/apps/www/public", "Shadcnui/apps/v4/public"].map((d) => path.resolve(ROOT, d))
  return {
    name: "library-public-dirs",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? "").split("?")[0])
        if (!/\.(png|jpe?g|gif|webp|avif|svg|ico|mp4|webm|mp3|woff2?|ttf|otf|json|glb|gltf|hdr|riv|lottie)$/i.test(url)) return next()
        if (url.startsWith("/@") || url.startsWith("/node_modules") || url.startsWith("/src")) return next()
        for (const d of dirs) {
          const f = path.resolve(d, "." + url)
          if (f.startsWith(d + path.sep) && fs.existsSync(f) && fs.statSync(f).isFile()) {
            const ext = path.extname(f).slice(1).toLowerCase()
            const type: Record<string, string> = { svg: "image/svg+xml", jpg: "image/jpeg", jpeg: "image/jpeg", mp4: "video/mp4", webm: "video/webm", json: "application/json", woff2: "font/woff2", woff: "font/woff", ico: "image/x-icon" }
            res.setHeader("Content-Type", type[ext] ?? `image/${ext}`)
            fs.createReadStream(f).pipe(res)
            return
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [crossRepoResolver(), libraryPublicDirs(), react(), tailwindcss()],
  // Absolute workspace path, used for "open in VS Code" links (vscode://file/<path>).
  define: { __ROOT__: JSON.stringify(ROOT.replace(/\\/g, "/")) },
  resolve: {
    alias: [
      { find: /^next\/image$/, replacement: shim("next-image.ts") },
      { find: /^next\/legacy\/image$/, replacement: shim("next-image.ts") },
      { find: /^next\/link$/, replacement: shim("next-link.ts") },
      { find: /^next\/navigation$/, replacement: shim("next-navigation.ts") },
      { find: /^next\/router$/, replacement: shim("next-router.ts") },
      { find: /^next\/dynamic$/, replacement: shim("next-dynamic.ts") },
      { find: /^next\/script$/, replacement: shim("next-script.ts") },
      { find: /^next\/head$/, replacement: shim("next-head.ts") },
      { find: /^next\/form$/, replacement: shim("next-form.ts") },
      { find: /^next\/server$/, replacement: shim("next-server.ts") },
      { find: /^next\/font\/google$/, replacement: shim("next-font-google.ts") },
      { find: /^next\/font\/local$/, replacement: shim("next-font-local.ts") },
      { find: /^geist\/font\/sans$/, replacement: shim("geist-sans.ts") },
      { find: /^geist\/font\/mono$/, replacement: shim("geist-mono.ts") },
      { find: /^geist\/font\/pixel$/, replacement: shim("geist-pixel.ts") },
      { find: /^server-only$/, replacement: shim("empty.ts") },
      // The gallery's own code uses "~/" ("@/" belongs to the library repos; aliases run before plugins).
      { find: /^~\//, replacement: path.resolve(APP, "src") + "/" },
    ],
    dedupe: ["react", "react-dom", "motion", "framer-motion", "three", "@react-three/fiber"],
  },
  server: { fs: { allow: [ROOT] }, port: 5310 },
  // A string tsconfigRaw stops Vite from reading each repo's own tsconfig.json (uilayouts' extends a workspace
  // package that isn't installed, which made every file in that package fail to compile).
  esbuild: {
    tsconfigRaw: JSON.stringify({ compilerOptions: { jsx: "react-jsx", useDefineForClassFields: true, target: "es2022" } }),
  },
  optimizeDeps: {
    // Every bare import the demos use (scripts/collect_deps.mjs), so nothing is discovered mid-session.
    include: OPTIMIZE,
    esbuildOptions: {
      tsconfigRaw: JSON.stringify({ compilerOptions: { jsx: "react-jsx", useDefineForClassFields: true } }),
    },
    // Scan every demo up front so all dependencies are pre-bundled once (otherwise each newly opened demo could
    // trigger a dependency re-optimization and a full page reload).
    entries: [
      "src/main.tsx",
      "../magicui/apps/www/registry/example/*.tsx",
      "../cult-ui/apps/www/registry/default/example/*.tsx",
      "../uilayouts/apps/ui-layout/registry/**/*.tsx",
      "../uilayouts/apps/ui-layout/components/ui/**/*.tsx",
      "../uilayouts/packages/blocks/src/**/*.tsx",
      "../Shadcnui/apps/v4/registry/new-york-v4/examples/*.tsx",
      "../Shadcnui/apps/v4/registry/new-york-v4/charts/*.tsx",
      "../Shadcnui/apps/v4/registry/new-york-v4/blocks/*/page.tsx",
    ],
  },
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: { shimMissingExports: true },
  },
})
