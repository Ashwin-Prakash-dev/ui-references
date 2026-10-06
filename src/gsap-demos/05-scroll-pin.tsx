import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export const meta = {
  title: "ScrollTrigger: pin + horizontal track",
  skill: "gsap-scrolltrigger",
  description: "Pin a section and translate a wide track sideways while scrolling. Function-based values + invalidateOnRefresh keep it correct on resize. (Scroll inside the box.)",
}

export default function ScrollPin() {
  const scroller = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const track = scroller.current!.querySelector<HTMLDivElement>(".h-track")!
      const distance = () => track.scrollWidth - scroller.current!.clientWidth + 32
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: ".pin-me",
          scroller: scroller.current,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          pinType: "transform", // required when the scroller is not the page
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
    },
    { scope: scroller }
  )

  return (
    <div ref={scroller} className="code-scroll h-[300px] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-lg border border-border">
      <p className="p-4 text-sm text-muted-foreground">↓ Scroll in here</p>
      <section className="pin-me flex h-[300px] items-center overflow-hidden">
        <div className="h-track flex gap-4 px-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex h-40 w-56 shrink-0 items-end rounded-lg bg-lime-400/80 p-3 font-mono text-sm text-black">0{i + 1}</div>
          ))}
        </div>
      </section>
      <div className="h-[300px] p-4 text-sm text-muted-foreground">…and the page continues.</div>
    </div>
  )
}
