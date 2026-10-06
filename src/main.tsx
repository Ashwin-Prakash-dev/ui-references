import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Tooltip as RadixTooltip } from "radix-ui"
import { TooltipProvider as LegacyTooltipProvider } from "@radix-ui/react-tooltip"

import App from "./App"
import "./styles/index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* App-level providers the libraries' own docs sites supply: theme (next-themes), toasts (sonner),
        and Radix tooltip providers (both the `radix-ui` meta package and the standalone package some demos use). */}
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <RadixTooltip.Provider delayDuration={0}>
        <LegacyTooltipProvider delayDuration={0}>
          <App />
          <Toaster richColors position="bottom-right" />
        </LegacyTooltipProvider>
      </RadixTooltip.Provider>
    </ThemeProvider>
  </StrictMode>
)
