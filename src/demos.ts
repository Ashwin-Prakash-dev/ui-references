import { lazy, type ComponentType, type LazyExoticComponent } from "react"

import manifestJson from "./data/manifest.json"

export type Entry = {
  id: string
  lib: "magicui" | "cult-ui" | "uilayouts" | "shadcn"
  libLabel: string
  name: string
  group: string
  title: string
  variant: string
  category: string
  description: string
  deps: string[]
  demo: string // path relative to the MeckyTest root
  source: string
  install: string
  docs: string
  kind: "component" | "block" | "chart"
}

export const ENTRIES = manifestJson as Entry[]

// Keys are relative to this file: "../../<repo>/...". Manifest paths are relative to the MeckyTest root.
type Loader = () => Promise<Record<string, unknown>>
const modules = {
  ...import.meta.glob("../../magicui/apps/www/registry/example/*.tsx"),
  ...import.meta.glob("../../cult-ui/apps/www/registry/default/example/*.tsx"),
  ...import.meta.glob("../../uilayouts/apps/ui-layout/registry/**/*.tsx"),
  ...import.meta.glob("../../uilayouts/apps/ui-layout/components/ui/**/*.tsx"),
  ...import.meta.glob("../../uilayouts/packages/blocks/src/**/*.tsx"),
  ...import.meta.glob("../../Shadcnui/apps/v4/registry/new-york-v4/examples/*.tsx"),
  ...import.meta.glob("../../Shadcnui/apps/v4/registry/new-york-v4/charts/*.tsx"),
  ...import.meta.glob("../../Shadcnui/apps/v4/registry/new-york-v4/blocks/*/page.tsx"),
} as Record<string, Loader>

const sources: Record<string, () => Promise<string>> = {
  ...import.meta.glob("../../magicui/apps/www/registry/example/*.tsx", { query: "?raw", import: "default" }),
  ...import.meta.glob("../../cult-ui/apps/www/registry/default/example/*.tsx", { query: "?raw", import: "default" }),
  ...import.meta.glob("../../uilayouts/apps/ui-layout/registry/**/*.tsx", { query: "?raw", import: "default" }),
  ...import.meta.glob("../../uilayouts/apps/ui-layout/components/ui/**/*.tsx", { query: "?raw", import: "default" }),
  ...import.meta.glob("../../uilayouts/packages/blocks/src/**/*.tsx", { query: "?raw", import: "default" }),
  ...import.meta.glob("../../Shadcnui/apps/v4/registry/new-york-v4/examples/*.tsx", { query: "?raw", import: "default" }),
  ...import.meta.glob("../../Shadcnui/apps/v4/registry/new-york-v4/charts/*.tsx", { query: "?raw", import: "default" }),
  ...import.meta.glob("../../Shadcnui/apps/v4/registry/new-york-v4/blocks/*/page.tsx", { query: "?raw", import: "default" }),
} as Record<string, () => Promise<string>>

const key = (p: string) => `../../${p}`

export const hasDemo = (e: Entry) => key(e.demo) in modules

export const loadSource = (e: Entry) => sources[key(e.demo)]?.() ?? Promise.resolve("// source not found")

const isComponent = (v: unknown) =>
  typeof v === "function" || (typeof v === "object" && v !== null && "$$typeof" in (v as object))

/**
 * Default export if present; otherwise the PascalCase export named after the file (faq-founder.tsx -> FaqFounder),
 * falling back to the first PascalCase component export. (shadcn charts and uilayouts blocks use named exports, and some
 * files export small sub-components before the main one.)
 */
function pick(mod: Record<string, unknown>, file: string): ComponentType {
  if (isComponent(mod.default)) return mod.default as ComponentType
  const comps = Object.entries(mod).filter(([k, v]) => /^[A-Z]/.test(k) && isComponent(v))
  const stem = (file.split("/").pop() ?? "").replace(/\.\w+$/, "").replace(/[^a-z0-9]/gi, "").toLowerCase()
  const named = comps.find(([k]) => k.toLowerCase() === stem) ?? comps[0]
  if (named) return named[1] as ComponentType
  throw new Error("This file has no renderable component export.")
}

const cache = new Map<string, LazyExoticComponent<ComponentType>>()

export function getDemo(e: Entry) {
  let c = cache.get(e.id)
  if (!c) {
    const load = modules[key(e.demo)]
    c = lazy(async () => {
      if (!load) throw new Error(`No module for ${e.demo}`)
      return { default: pick(await load(), e.demo) }
    })
    cache.set(e.id, c)
  }
  return c
}

/** Drop the cached lazy component so "reload" re-imports from scratch. */
export const resetDemo = (e: Entry) => cache.delete(e.id)
