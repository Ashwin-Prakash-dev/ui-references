import { useRef } from "react"
import gsap from "gsap"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, MotionPathPlugin)

export const meta = {
  title: "MotionPath: follow an SVG path",
  skill: "gsap-plugins",
  description: "Move an element along any SVG path; autoRotate turns it to face the direction of travel. Here: a lap of a track.",
}

export default function MotionPath() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.to(".kart", {
        duration: 5,
        repeat: -1,
        ease: "none",
        motionPath: { path: ".track-path", align: ".track-path", alignOrigin: [0.5, 0.5], autoRotate: true },
      })
    },
    { scope: root }
  )

  return (
    <div ref={root} className="relative w-full max-w-md">
      <svg viewBox="0 0 400 240" className="w-full overflow-visible">
        <path
          className="track-path"
          d="M60 120 C60 40 140 30 200 60 S330 40 350 110 S300 210 220 190 S120 230 80 190 S60 160 60 120Z"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="14"
          strokeLinejoin="round"
        />
      </svg>
      <div className="kart absolute left-0 top-0 h-3 w-6 rounded-sm bg-lime-400" />
    </div>
  )
}
