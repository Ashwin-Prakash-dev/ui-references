import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

export const meta = {
  title: "Grid stagger from center",
  skill: "gsap-core",
  description: "stagger with grid: 'auto' infers rows/columns from the layout and ripples outward from a point.",
}

export default function Stagger() {
  const root = useRef<HTMLDivElement>(null)
  const { contextSafe } = useGSAP(
    () => {
      gsap.from(".cell", { scale: 0, opacity: 0, duration: 0.6, ease: "power2.out", stagger: { each: 0.03, grid: "auto", from: "center" } })
    },
    { scope: root }
  )
  const replay = contextSafe(() => {
    gsap.fromTo(".cell", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out", stagger: { each: 0.03, grid: "auto", from: "random" } })
  })

  return (
    <div ref={root} className="flex flex-col items-center gap-6">
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 70 }).map((_, i) => (
          <div key={i} className="cell size-6 rounded-sm bg-lime-400/80" />
        ))}
      </div>
      <button onClick={replay} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Replay (from: random)</button>
    </div>
  )
}
