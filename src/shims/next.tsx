// Minimal stand-ins for the Next.js APIs the library demos import (they are Next apps; this gallery is Vite).
// Each export keeps the call shape the demos use and renders plain DOM.
import {
  forwardRef,
  lazy,
  Suspense,
  type AnchorHTMLAttributes,
  type ComponentType,
  type CSSProperties,
  type FormHTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react"

/* ---------- next/image ---------- */
type StaticImage = { src: string; width?: number; height?: number }
type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | StaticImage
  fill?: boolean
  priority?: boolean
  quality?: number
  placeholder?: string
  blurDataURL?: string
  unoptimized?: boolean
  loader?: unknown
  overrideSrc?: string
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { src, fill, priority, quality, placeholder, blurDataURL, unoptimized, loader, overrideSrc, style, width, height, ...rest },
  ref
) {
  void quality; void placeholder; void blurDataURL; void unoptimized; void loader; void overrideSrc
  const url = typeof src === "string" ? src : src?.src
  const fillStyle: CSSProperties = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : {}
  return (
    <img
      ref={ref}
      src={url}
      width={fill ? undefined : width ?? (typeof src === "object" ? src.width : undefined)}
      height={fill ? undefined : height ?? (typeof src === "object" ? src.height : undefined)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={{ ...fillStyle, ...style }}
      {...rest}
    />
  )
})

/* ---------- next/link ---------- */
type Href = string | { pathname?: string; query?: Record<string, string>; hash?: string }
type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: Href
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  passHref?: boolean
  legacyBehavior?: boolean
  locale?: string | false
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, prefetch, replace, scroll, shallow, passHref, legacyBehavior, locale, onClick, ...rest },
  ref
) {
  void prefetch; void replace; void scroll; void shallow; void passHref; void legacyBehavior; void locale
  const url = typeof href === "string" ? href : `${href.pathname ?? ""}${href.hash ? `#${href.hash}` : ""}`
  // Demo links point at the libraries' own routes: keep them inert inside the gallery.
  return (
    <a
      ref={ref}
      href={url}
      onClick={(e) => {
        onClick?.(e)
        if (!url.startsWith("http")) e.preventDefault()
      }}
      {...rest}
    />
  )
})

/* ---------- next/navigation + next/router ---------- */
const router = {
  push: () => {}, replace: () => {}, back: () => {}, forward: () => {}, refresh: () => {}, prefetch: () => Promise.resolve(),
  pathname: "/", asPath: "/", query: {}, route: "/", isReady: true,
  events: { on: () => {}, off: () => {}, emit: () => {} },
}
export const useRouter = () => router
export const usePathname = () => "/"
export const useSearchParams = () => new URLSearchParams()
export const useParams = () => ({})
export const useSelectedLayoutSegment = () => null
export const useSelectedLayoutSegments = () => [] as string[]
export function notFound(): never {
  throw new Error("notFound() called in a page demo")
}
export function redirect(url: string): never {
  throw new Error(`redirect(${url}) called in a page demo`)
}

/* ---------- next/dynamic ---------- */
export function dynamic<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
  opts: { loading?: ComponentType; ssr?: boolean } = {}
) {
  const L = lazy(async () => {
    const m = await loader()
    return "default" in (m as object) ? (m as { default: ComponentType<P> }) : { default: m as ComponentType<P> }
  })
  const Fallback = opts.loading
  return function DynamicComponent(props: P) {
    return (
      <Suspense fallback={Fallback ? <Fallback /> : null}>
        <L {...props} />
      </Suspense>
    )
  }
}

/* ---------- next/script, next/head, next/form ---------- */
export const Script = () => null
export const Head = ({ children }: { children?: ReactNode }) => <>{children ? null : null}</>
export const Form = forwardRef<HTMLFormElement, FormHTMLAttributes<HTMLFormElement> & { action?: string }>(function Form(
  { onSubmit, ...rest },
  ref
) {
  return <form ref={ref} onSubmit={(e) => { e.preventDefault(); onSubmit?.(e) }} {...rest} />
})

/* ---------- next/server (only types are used in demos) ---------- */
export const NextResponse = { json: (b: unknown) => b, redirect: () => null, next: () => null }

/* ---------- fonts: next/font/* and geist/font/* ---------- */
const font = (family: string) => ({ className: "", variable: "", style: { fontFamily: family } })
const google = () => font("inherit")
export const DM_Sans = google
export const Manrope = google
export const Poppins = google
export const Space_Grotesk = google
export const Vazirmatn = google
export const Inter = google
export const localFont = google
export const GeistSans = font("ui-sans-serif, system-ui, sans-serif")
export const GeistMono = font("ui-monospace, SFMono-Regular, monospace")
export const GeistPixelSquare = font("ui-monospace, monospace")
