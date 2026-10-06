import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

export const meta = {
  title: "Tweens: to / from / fromTo",
  skill: "gsap-core",
  description: "The three tween types. Animate transforms and opacity (compositor-friendly); use eases to shape motion.",
}

export default function Tweens() {
  const root = useRef<HTMLDivElement>(null)
  const { contextSafe } = useGSAP({ scope: root })

  const play = contextSafe(() => {
    gsap.to(".t-to", { x: 140, rotation: 180, duration: 1, ease: "power3.inOut", yoyo: true, repeat: 1 })
    gsap.from(".t-from", { y: -60, opacity: 0, duration: 0.9, ease: "back.out(1.7)" })
    gsap.fromTo(".t-fromto", { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: "elastic.out(1, 0.4)" })
  })

  return (
    <div ref={root} className="flex w-full flex-col items-center gap-8">
      <div className="flex w-full max-w-md flex-col gap-5">
        {[["t-to", "gsap.to"], ["t-from", "gsap.from"], ["t-fromto", "gsap.fromTo"]].map(([c, l]) => (
          <div key={c} className="flex items-center gap-4">
            <span className="w-24 font-mono text-xs text-muted-foreground">{l}</span>
            <div className={`${c} size-10 rounded-lg bg-lime-400`} />
          </div>
        ))}
      </div>
      <button onClick={play} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Play</button>
    </div>
  )
}
