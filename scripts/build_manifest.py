#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build src/data/manifest.json (one entry per live demo) and src/data/design.json (palettes, fonts, styles, motion).

Sources: each library's own registry.json + docs frontmatter, the build-website component catalog
(skills/build-website/data/components.csv) for categories, and the ui-ux-pro-max CSVs for design data.
Run from ui-reference/:  python scripts/build_manifest.py
"""
import csv, json, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parent
ROOT = APP.parent  # MeckyTest
OUT = APP / "src" / "data"

LIB = {
    "magicui": "Magic UI",
    "cult-ui": "Cult UI",
    "uilayouts": "UI Layouts",
    "shadcn": "shadcn/ui",
}


def rel(p: Path) -> str:
    return p.resolve().relative_to(ROOT.resolve()).as_posix()


def frontmatter(p: Path) -> dict:
    if not p.exists():
        return {}
    t = p.read_text(encoding="utf8", errors="ignore")
    out = {}
    m = re.match(r"---\s*\n(.*?)\n---", t, re.S)
    if m:
        for line in m.group(1).splitlines():
            k, _, v = line.partition(":")
            if v.strip():
                out[k.strip()] = v.strip().strip('"').strip("'")
    else:  # uilayouts: export const metadata = { title: "...", description: "..." }
        for k in ("title", "description"):
            mm = re.search(rf'{k}:\s*"([^"]+)"', t[:2000])
            if mm:
                out[k] = mm.group(1)
    return out


def title_case(name: str) -> str:
    return " ".join(w.upper() if w in ("ui", "ai", "3d", "otp", "cta", "ev", "svg") else w.capitalize() for w in re.split(r"[-_]", name))


catalog = {}
with open(ROOT / "skills/build-website/data/components.csv", encoding="utf8") as f:
    for r in csv.DictReader(f):
        catalog[r["id"]] = r


def deps_of(item):
    return [d for d in (item.get("dependencies") or []) if not d.startswith("@types/")]


entries = []


def add(**e):
    e.setdefault("variant", "")
    e.setdefault("kind", "component")
    e.setdefault("deps", [])
    e["libLabel"] = LIB[e["lib"]]
    e["id"] = f'{e["lib"]}/{e["name"]}'
    entries.append(e)


# ---------------- Magic UI: every registry example, grouped by its parent component ----------------
mroot = ROOT / "magicui/apps/www"
items = json.load(open(mroot / "registry.json", encoding="utf8"))["items"]
ui = {i["name"]: i for i in items if i["type"] == "registry:ui"}
for it in items:
    if it["type"] != "registry:example" or not it.get("files"):
        continue
    demo = mroot / it["files"][0]["path"]
    if not demo.exists():
        continue
    parents = [d.split("/")[-1] for d in it.get("registryDependencies", []) if d.startswith("@magicui/")]
    parent = next((p for p in parents if p in ui), None) or max((n for n in ui if it["name"].startswith(n)), key=len, default=it["name"])
    p = ui.get(parent, {})
    cat = catalog.get(f"magicui/{parent}", {})
    add(
        lib="magicui", name=it["name"], group=parent, title=p.get("title") or title_case(parent),
        variant=it.get("title", "") if it["name"] != f"{parent}-demo" else "",
        category=cat.get("category", "misc"),
        description=it.get("description") or p.get("description", ""),
        deps=deps_of(p), demo=rel(demo),
        source=rel(mroot / p["files"][0]["path"]) if p.get("files") else rel(demo),
        install=f"npx shadcn@latest add @magicui/{parent}",
        docs=f"https://magicui.design/docs/components/{parent}",
    )

# ---------------- Cult UI: <name>-demo examples ----------------
croot = ROOT / "cult-ui/apps/www"
items = json.load(open(croot / "registry.json", encoding="utf8"))["items"]
cui = {i["name"]: i for i in items if i["type"] == "registry:ui"}
for it in items:
    if it["type"] != "registry:component" or not it.get("files"):
        continue
    demo = croot / it["files"][0]["path"]
    if not demo.exists() or "/example/" not in it["files"][0]["path"]:
        continue
    parent = it["name"][:-5] if it["name"].endswith("-demo") else it["name"]
    p = cui.get(parent, {})
    fm = frontmatter(croot / "content/docs/components" / f"{parent}.mdx")
    cat = catalog.get(f"cult-ui/{parent}", {})
    add(
        lib="cult-ui", name=it["name"], group=parent, title=fm.get("title") or title_case(parent),
        category=cat.get("category", "misc"),
        description=fm.get("description") or p.get("description", ""),
        deps=deps_of(p), demo=rel(demo),
        source=rel(croot / p["files"][0]["path"]) if p.get("files") else rel(demo),
        install=f"npx shadcn@latest add https://cult-ui.com/r/{parent}.json",
        docs=f"https://www.cult-ui.com/docs/components/{parent}",
    )

# ---------------- UI Layouts: every registry entry is itself a demo (components + section blocks) ----------------
uroot = ROOT / "uilayouts/apps/ui-layout"
items = json.load(open(uroot / "registry.json", encoding="utf8"))["items"]
docs = {}
for f in (uroot / "content").rglob("*.mdx"):
    docs[f.stem] = frontmatter(f)
# Multi-file entries list the reusable component (components/ui/...) first and the actual demo (registry/...) after it.
def files_of(it):
    return [f["path"].replace("\\", "/") for f in it.get("files") or []]


def demo_file(fs):
    return next((f for f in fs if f.startswith("./registry/") or "packages/blocks" in f), fs[0])


used_as_part = {f for it in items for f in files_of(it)[1:] if "/components/ui/" in f}
used_as_part |= {f for it in items for f in files_of(it) if "/components/ui/" in f and demo_file(files_of(it)) != f}
for it in items:
    fs = files_of(it)
    if not fs:
        continue
    dfile = demo_file(fs)
    # A bare building block (no demo of its own) that other demos already use: those demos cover it.
    if "/components/ui/" in dfile and dfile in used_as_part:
        continue
    if "/components/website/" in dfile:  # the docs site's own widgets (code tabs, previews), not UI components
        continue
    sfile = next((f for f in fs if "/components/ui/" in f), dfile)
    path = (uroot / dfile).resolve()
    if not path.exists() or path.suffix != ".tsx":
        continue
    parts = dfile.split("/")
    folder = parts[-2] if len(parts) > 1 else it["name"]
    block = it["type"] == "registry:block"
    group = folder if folder not in ("ui", "src") else it["name"]
    if block:
        group = folder.replace("-section", "")  # hero-section -> hero
    fm = docs.get(folder) or docs.get(it["name"]) or {}
    cat = catalog.get(f"uilayouts/{it['name']}", {})
    add(
        lib="uilayouts", name=it["name"], group=group,
        title=title_case(it["name"]),
        category=("section" if block else cat.get("category", "misc")),
        description=fm.get("description") or cat.get("description", ""),
        deps=deps_of(it), demo=rel(path), source=rel((uroot / sfile).resolve()),
        install=f"npx shadcn@latest add https://www.ui-layouts.com/r/{it['name']}.json",
        docs=f"https://www.ui-layouts.com/components/{folder}" if not block else "https://www.ui-layouts.com/blocks",
        kind="block" if block else "component",
    )

# ---------------- shadcn/ui (new-york-v4): primitives' examples, charts, blocks ----------------
sroot = ROOT / "Shadcnui/apps/v4"
reg = sroot / "registry/new-york-v4"
prims = sorted((p.stem for p in (reg / "ui").glob("*.tsx") if not p.stem.startswith("_")), key=len, reverse=True)
SHAD_CAT = {
    "form": "button button-group input input-group input-otp checkbox radio-group select native-select slider switch textarea toggle toggle-group calendar date-picker combobox form field label kbd".split(),
    "navigation": "breadcrumb navigation-menu menubar pagination tabs sidebar command context-menu dropdown-menu".split(),
    "feedback": "alert alert-dialog dialog drawer sheet sonner toast tooltip hover-card popover progress skeleton spinner empty".split(),
    "layout": "accordion aspect-ratio card collapsible resizable scroll-area separator table data-table carousel item direction".split(),
    "media": "avatar badge typography marker attachment bubble message message-scroller".split(),
    "data-viz": ["chart"],
}
cat_of = {n: c for c, ns in SHAD_CAT.items() for n in ns}
for f in sorted((reg / "examples").glob("*.tsx")):
    stem = f.stem
    group = next((p for p in prims if stem == p or stem.startswith(p + "-")), stem.rsplit("-", 1)[0])
    fm = frontmatter(sroot / "content/docs/components/radix" / f"{group}.mdx")
    variant = stem[len(group):].strip("-")
    add(
        lib="shadcn", name=stem, group=group, title=fm.get("title") or title_case(group),
        variant="" if variant == "demo" else title_case(variant),
        category=cat_of.get(group, "misc"),
        description=fm.get("description", ""),
        demo=rel(f), source=rel(reg / "ui" / f"{group}.tsx") if (reg / "ui" / f"{group}.tsx").exists() else rel(f),
        install=f"npx shadcn@latest add {group}",
        docs=f"https://ui.shadcn.com/docs/components/{group}",
    )
for f in sorted((reg / "charts").glob("chart-*.tsx")):
    kind = f.stem.split("-")[1]
    add(
        lib="shadcn", name=f.stem, group=f"chart-{kind}", title=f"{kind.capitalize()} Chart",
        variant=title_case(f.stem.split("-", 2)[2]) if f.stem.count("-") >= 2 else "",
        category="data-viz", description="Recharts chart wrapped in shadcn's ChartContainer, themed by CSS variables.",
        deps=["recharts"], demo=rel(f), source=rel(reg / "ui/chart.tsx"),
        install="npx shadcn@latest add chart", docs="https://ui.shadcn.com/charts", kind="chart",
    )
for d in sorted((reg / "blocks").iterdir()):
    page = d / "page.tsx"
    if not page.exists():
        continue
    add(
        lib="shadcn", name=d.name, group=d.name.rsplit("-", 1)[0], title=title_case(d.name),
        category="section", description=f"Full-page block: {d.name.rsplit('-', 1)[0].replace('-', ' ')}.",
        demo=rel(page), source=rel(page), install=f"npx shadcn@latest add {d.name}",
        docs="https://ui.shadcn.com/blocks", kind="block",
    )

OUT.mkdir(parents=True, exist_ok=True)
json.dump(entries, open(OUT / "manifest.json", "w", encoding="utf8"), ensure_ascii=False, indent=0)

# ---------------- Design data (ui-ux-pro-max) ----------------
D = ROOT / "skills/ui-ux-pro-max/data"


def rows(name):
    with open(D / name, encoding="utf8") as f:
        return list(csv.DictReader(f))


palettes = [
    {"name": r["Product Type"], "notes": r.get("Notes", ""),
     "colors": {k: r[k] for k in ("Primary", "Secondary", "Accent", "Background", "Foreground", "Card", "Muted", "Border", "Destructive") if r.get(k, "").startswith("#")}}
    for r in rows("colors.csv")
]
fonts = [
    {"name": r["Font Pairing Name"], "category": r["Category"], "heading": r["Heading Font"], "body": r["Body Font"],
     "mood": r["Mood/Style Keywords"], "bestFor": r["Best For"], "url": r["Google Fonts URL"]}
    for r in rows("typography.csv")
]
styles = [
    {"name": r["Style Category"], "id": r.get("Style ID", ""), "status": r.get("Status", ""), "keywords": r["Keywords"],
     "colors": r["Primary Colors"], "effects": r["Effects & Animation"], "bestFor": r["Best For"], "avoid": r["Do Not Use For"],
     "era": r.get("Era/Origin", ""), "complexity": r.get("Complexity", "")}
    for r in rows("styles.csv") if r.get("Status", "active") != "deprecated"
]
motion = [
    {"category": r["Category"], "tier": r["Intensity Tier"], "trigger": r["Trigger"], "duration": r["Duration"],
     "easing": r["Easing"], "snippet": r["GSAP Snippet"], "do": r["Do"], "dont": r["Don't"]}
    for r in rows("motion.csv")
]
json.dump({"palettes": palettes, "fonts": fonts, "styles": styles, "motion": motion},
          open(OUT / "design.json", "w", encoding="utf8"), ensure_ascii=False)

from collections import Counter
print(len(entries), "demos:", dict(Counter(e["lib"] for e in entries)), "| kinds:", dict(Counter(e["kind"] for e in entries)))
print("design:", len(palettes), "palettes,", len(fonts), "font pairs,", len(styles), "styles,", len(motion), "motion presets")
