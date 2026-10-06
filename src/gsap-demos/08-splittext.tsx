import { useRef } from "react"
import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, SplitText)

export const meta = {
  title: "SplitText: masked line/char reveal",
  skill: "gsap-plugins",
  description: "Split into lines/words/chars; mask wraps each piece so it slides in from behind a clip. Reverted automatically by useGSAP.",
}

export default function SplitDemo() {
  const root = useRef<HTMLDivElement>(null)
  const { contextSafe } = useGSAP({ scope: root })

  const run = contextSafe((type: "chars" | "words" | "lines") => {
    const split = SplitText.create(".split-me", { type: "lines,words,chars", mask: type })
    gsap.from(split[type], {
      yPercent: 110,
      opacity: 0,
      duration: 0.8,
      ease: "expo.out",
      stagger: type === "chars" ? 0.015 : type === "words" ? 0.05 : 0.12,
      onComplete: () => split.revert(),
    })
  })

  return (
    <div ref={root} className="flex w-full max-w-lg flex-col gap-6">
      <h3 className="split-me text-3xl font-black uppercase leading-tight tracking-tight">Built by hand. Run at speed. Every chassis tells a story.</h3>
      <div className="flex gap-2">
        {(["chars", "words", "lines"] as const).map((t) => (
          <button key={t} onClick={() => run(t)} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">{t}</button>
        ))}
      </div>
    </div>
  )
}
