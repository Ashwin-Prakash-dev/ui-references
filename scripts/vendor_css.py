#!/usr/bin/env python3
"""Vendor each library's globals.css into src/styles/vendor/ so their keyframes, animations, utilities and
theme tokens all exist in one Tailwind v4 build. Run from ui-reference/: python scripts/vendor_css.py"""
import re
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
ROOT = APP.parent
OUT = APP / "src/styles/vendor"
OUT.mkdir(parents=True, exist_ok=True)

# Order matters: later files win for shared tokens (--background, --primary, ...). shadcn's official tokens go last.
SOURCES = [
    ("uilayouts-token", ROOT / "uilayouts/apps/ui-layout/app/token.css"),
    ("uilayouts", ROOT / "uilayouts/apps/ui-layout/app/globals.css"),
    ("cult-ui", ROOT / "cult-ui/apps/www/styles/globals.css"),
    ("magicui", ROOT / "magicui/apps/www/styles/globals.css"),
    ("shadcn", ROOT / "Shadcnui/apps/v4/app/globals.css"),
]

hoisted = []  # @plugin / package @imports, de-duplicated into index.css
for name, src in SOURCES:
    css = src.read_text(encoding="utf8")
    out = []
    for line in css.splitlines():
        s = line.strip()
        if re.match(r'@import\s+["\']tailwindcss["\']', s):
            continue
        if s.startswith("@source") or s.startswith("@custom-variant"):
            continue
        m = re.match(r'@import\s+["\'](\./|\.\./)?([^"\']+)["\'];?', s)
        if m:
            target = m.group(2)
            if m.group(1):  # relative import (token.css, legacy-themes.css): token handled separately, themes dropped
                continue
            if target not in hoisted:
                hoisted.append(target)
            continue
        if s.startswith("@plugin"):
            if s not in hoisted:
                hoisted.append(s)
            continue
        out.append(line)
    (OUT / f"{name}.css").write_text(f"/* Vendored from {src.relative_to(ROOT).as_posix()} */\n" + "\n".join(out) + "\n", encoding="utf8")

imports = [h for h in hoisted if not h.startswith("@plugin")]
plugins = [h for h in hoisted if h.startswith("@plugin")]
(OUT / "_hoisted.txt").write_text("\n".join(imports + plugins), encoding="utf8")
print("hoisted imports:", imports)
print("hoisted plugins:", plugins)
