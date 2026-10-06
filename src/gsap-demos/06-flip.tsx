import { useRef, useState } from "react"
import gsap from "gsap"
import { Flip } from "gsap/Flip"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, Flip)

export const meta = {
  title: "Flip: animate layout changes",
  skill: "gsap-plugins",
  description: "Record state, change the DOM/layout (here: grid ↔ list and shuffle), then Flip.from() animates between the two.",
}

export default function FlipDemo() {
  const root = useRef<HTMLDivElement>(null)
  const state = useRef<Flip.FlipState>(null)
  const [grid, setGrid] = useState(true)
  const [order, setOrder] = useState([1, 2, 3, 4, 5, 6])

  // After React commits the new layout, animate from the recorded state.
  useGSAP(
    () => {
      if (!state.current) return
      Flip.from(state.current, { duration: 0.7, ease: "power2.inOut", stagger: 0.03, absolute: true })
    },
    { scope: root, dependencies: [grid, order] }
  )

  const change = (fn: () => void) => {
    state.current = Flip.getState(root.current!.querySelectorAll(".f-item"))
    fn()
  }

  return (
    <div ref={root} className="flex w-full max-w-md flex-col items-center gap-5">
      <div className={grid ? "grid w-full grid-cols-3 gap-2" : "flex w-full flex-col gap-2"}>
        {order.map((n) => (
          <div key={n} data-flip-id={n} className={`f-item rounded-md bg-lime-400/80 font-mono text-sm text-black ${grid ? "flex h-20 items-center justify-center" : "h-8 px-3 leading-8"}`}>
            {n}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => change(() => setGrid((g) => !g))} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">Toggle layout</button>
        <button onClick={() => change(() => setOrder((o) => [...o].sort(() => Math.random() - 0.5)))} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">Shuffle</button>
      </div>
    </div>
  )
}
