# UI Reference

A standalone, local gallery of the UI libraries in this workspace. It renders their **own demo files live**, straight
from the repos, so you don't have to open their documentation. It is not connected to any website.

| Tab | What's in it | Source |
|---|---|---|
| Components | 859 live demos, filterable by library, type (component / chart / block) and category, with search | Magic UI, Cult UI, UI Layouts, shadcn/ui |
| GSAP & motion | 10 live GSAP pattern demos (tweens, stagger, timeline, ScrollTrigger scrub/pin, Flip, Draggable, SplitText, quickTo, MotionPath) + 17 motion presets | `gsap-skills`, `skills/ui-ux-pro-max` |
| Design data | 192 palettes, 74 font pairings (rendered in their fonts), 79 styles | `skills/ui-ux-pro-max/data` |
| Inspiration | The Awwwards-style example sites | `Awward_Website_Examples` |

Every card shows **its source library**, category, npm dependencies, the library's own install command (copy button),
"Show code" (the demo's code), links that open the demo and component files in VS Code, and the docs link.

## Run

```bash
cd ui-reference
npm run dev        # http://localhost:5310 (next free port if taken)
```

The first start after a dependency change pre-bundles ~180 packages and takes about a minute; after that it starts in seconds.
Light/dark toggle is top right (many demos are designed for one or the other).

## How it works

- `vite.config.ts` has a small resolver: each repo maps `@/...` to its own app folder (exactly like its tsconfig), so demo
  files import their components unchanged. Bare imports from the repos resolve from this app's `node_modules`.
  Anything unresolvable becomes a stub that throws, so a broken demo shows an error **on its own card** only.
- Next.js-only imports (`next/image`, `next/link`, `next/navigation`, fonts…) are replaced by tiny shims in `src/shims/`.
- Each library's `globals.css` (keyframes, animations, utilities, theme tokens) is vendored into `src/styles/vendor/`.
- Cards mount their demo only when scrolled near and unmount when far away (keeps WebGL/timers under control).
  Previews are contained, so `position: fixed` demos (cursors, progress bars, docks) stay inside their card.

## When a library repo is updated

```bash
python scripts/build_manifest.py   # re-index demos (registry.json + docs frontmatter + component catalog)
python scripts/vendor_css.py       # re-copy each library's globals.css
node scripts/collect_deps.mjs      # re-list imports to pre-bundle
# new npm dependency? npm install <pkg> --legacy-peer-deps
```

## Known limits

- Audited: 857 of 859 demos render. The 2 exceptions (UI Layouts `animated-beam`, `tree-code-viewer`) are building
  blocks registered without a demo: they need refs/props from a parent, and their card says so. Code, install command and
  source links still work for them.
- In dev mode each demo is compiled the first time it is opened, so heavy ones (WebGL, shaders, full sections) can take
  a few seconds on first view; after that they are instant.
- Demos built for a full page (blocks/sections) render in a scaled 1280px virtual viewport.
