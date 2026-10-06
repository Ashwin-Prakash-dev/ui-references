import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export const meta = {
  title: "ScrollTrigger: scrub",
  skill: "gsap-scrolltrigger",
  description: "Tie progress to scroll position. scrub: true follows exactly; a number adds catch-up smoothing. (Scroll inside the box.)",
}

export default function ScrollScrub() {
  const scroller = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const st = { trigger: ".track", scroller: scroller.current, start: "top center", end: "bottom center", scrub: 0.5 }
      gsap.to(".spin", { rotation: 360, x: 180, ease: "none", scrollTrigger: st })
      gsap.to(".fill", { scaleX: 1, ease: "none", scrollTrigger: { ...st, scrub: true } })
    },
    { scope: scroller }
  )

  return (
    <div ref={scroller} className="code-scroll h-[300px] w-full max-w-md overflow-y-auto rounded-lg border border-border">
      <p className="p-4 text-sm text-muted-foreground">↓ Scroll in here</p>
      <div className="h-[200px]" />
      <div className="track sticky top-0 flex h-[300px] flex-col justify-center gap-6 px-6">
        <div className="spin size-12 rounded-lg bg-lime-400" />
        <div className="h-1 w-full bg-border">
          <div className="fill h-1 origin-left scale-x-0 bg-lime-400" />
        </div>
      </div>
      <div className="h-[500px]" />
    </div>
  )
}
