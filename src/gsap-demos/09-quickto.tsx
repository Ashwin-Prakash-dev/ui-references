import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

export const meta = {
  title: "quickTo: cursor follower",
  skill: "gsap-performance",
  description: "gsap.quickTo() reuses one tween per property: the efficient way to follow high-frequency input like pointermove.",
}

export default function QuickTo() {
  const area = useRef<HTMLDivElement>(null)

  useGSAP(
    (_ctx, contextSafe) => {
      const el = area.current!
      const dot = el.querySelector(".dot")!
      const ring = el.querySelector(".ring")!
      const dx = gsap.quickTo(dot, "x", { duration: 0.15, ease: "power3" })
      const dy = gsap.quickTo(dot, "y", { duration: 0.15, ease: "power3" })
      const rx = gsap.quickTo(ring, "x", { duration: 0.6, ease: "power3" })
      const ry = gsap.quickTo(ring, "y", { duration: 0.6, ease: "power3" })
      const move = contextSafe!((e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        const x = e.clientX - r.left
        const y = e.clientY - r.top
        dx(x); dy(y); rx(x); ry(y)
      })
      el.addEventListener("pointermove", move)
      return () => el.removeEventListener("pointermove", move)
    },
    { scope: area }
  )

  return (
    <div ref={area} className="relative h-[300px] w-full max-w-md cursor-none overflow-hidden rounded-lg border border-dashed border-border">
      <span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Move your pointer here</span>
      <div className="ring pointer-events-none absolute -left-5 -top-5 size-10 rounded-full border-2 border-lime-400" />
      <div className="dot pointer-events-none absolute -left-1.5 -top-1.5 size-3 rounded-full bg-lime-400" />
    </div>
  )
}
