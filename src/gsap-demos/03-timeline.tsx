import { useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

export const meta = {
  title: "Timeline: sequencing + position parameter",
  skill: "gsap-timeline",
  description: "One timeline, controllable as a unit. '<' starts with the previous tween, '+=0.2' adds a gap, labels mark points.",
}

export default function Timeline() {
  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline>(null)
  const [progress, setProgress] = useState(0)

  useGSAP(
    () => {
      tl.current = gsap
        .timeline({ paused: true, defaults: { duration: 0.6, ease: "power2.out" }, onUpdate: () => setProgress(tl.current!.progress()) })
        .from(".a", { x: -80, opacity: 0 })
        .from(".b", { x: -80, opacity: 0 }, "<0.15") // start 0.15s after the previous tween starts
        .addLabel("middle")
        .from(".c", { y: 40, opacity: 0 }, "+=0.2") // 0.2s gap
        .to(".bar", { scaleX: 1, duration: 1.2, ease: "none" }, "middle")
    },
    { scope: root }
  )

  return (
    <div ref={root} className="flex w-full max-w-md flex-col gap-5">
      <div className="a h-8 w-40 rounded bg-lime-400" />
      <div className="b h-8 w-56 rounded bg-lime-400/70" />
      <div className="c h-8 w-32 rounded bg-lime-400/50" />
      <div className="bar h-1 w-full origin-left scale-x-0 bg-foreground" />
      <div className="flex flex-wrap gap-2">
        {(["play", "reverse", "restart"] as const).map((m) => (
          <button key={m} onClick={() => tl.current?.[m]()} className="rounded-md border border-border px-3 py-1.5 text-sm capitalize hover:bg-muted">{m}</button>
        ))}
        <button onClick={() => tl.current?.seek("middle").pause()} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">seek("middle")</button>
      </div>
      <input type="range" min={0} max={1} step={0.001} value={progress} onChange={(e) => tl.current?.progress(+e.target.value).pause()} aria-label="Timeline progress" />
    </div>
  )
}
