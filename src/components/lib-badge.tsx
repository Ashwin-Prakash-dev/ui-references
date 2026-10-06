const TONE: Record<string, string> = {
  "magicui": "bg-violet-500/12 text-violet-600 ring-violet-500/25 dark:text-violet-300",
  "cult-ui": "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  "uilayouts": "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  "shadcn": "bg-zinc-500/12 text-zinc-700 ring-zinc-500/25 dark:text-zinc-200",
  "gsap": "bg-lime-500/12 text-lime-700 ring-lime-500/25 dark:text-lime-300",
  "ui-ux-pro-max": "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300",
  "awwwards": "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
}

/** The source library, shown on every card. */
export function LibBadge({ lib, label }: { lib: string; label: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONE[lib] ?? TONE.shadcn}`}>
      {label}
    </span>
  )
}
