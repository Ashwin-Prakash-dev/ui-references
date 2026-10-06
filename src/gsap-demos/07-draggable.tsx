import { useRef } from "react"
import gsap from "gsap"
import { Draggable } from "gsap/Draggable"
import { InertiaPlugin } from "gsap/InertiaPlugin"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, Draggable, InertiaPlugin)

export const meta = {
  title: "Draggable + inertia",
  skill: "gsap-plugins",
  description: "Drag with bounds; inertia: true throws with momentum and settles inside the bounds. Second item snaps rotation to 45°.",
}

export default function DraggableDemo() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      Draggable.create(".drag-box", { bounds: root.current, inertia: true, edgeResistance: 0.65 })
      Draggable.create(".drag-dial", { type: "rotation", inertia: true, snap: (v: number) => Math.round(v / 45) * 45 })
    },
    { scope: root }
  )

  return (
    <div ref={root} className="relative flex h-[300px] w-full max-w-md items-center justify-around rounded-lg border border-dashed border-border">
      <div className="drag-box flex size-20 cursor-grab items-center justify-center rounded-xl bg-lime-400 text-xs font-medium text-black active:cursor-grabbing">drag</div>
      <div className="drag-dial relative size-28 cursor-grab rounded-full border-4 border-lime-400">
        <span className="absolute left-1/2 top-1 h-6 w-1 -translate-x-1/2 rounded bg-lime-400" />
        <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">spin</span>
      </div>
    </div>
  )
}
