import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreHydrator } from "@/components/store-hydrator";
import { Nav } from "@/components/nav";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://chromoforge.vercel.app"),
  title: {
    default: "chromoforge — design life for worlds we know exist",
    template: "%s · chromoforge",
  },
  description:
    "A synthetic-biology foundry: compose genomes, design CRISPR guides behind a biosecurity gate, and release organisms into real exoplanet environments.",
  keywords: [
    "synthetic biology",
    "exoplanets",
    "CRISPR",
    "astrobiology",
    "genome design",
    "NASA",
    "Next.js",
  ],
  openGraph: {
    title: "chromoforge — design life for worlds we know exist",
    description:
      "Compose genomes, design CRISPR guides behind a biosecurity gate, and release organisms into real exoplanet environments.",
    type: "website",
    images: [{ url: "/og", width: 1200, height: 630, alt: "chromoforge — design life for worlds we know exist" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "chromoforge — design life for worlds we know exist",
    description: "A synthetic-biology foundry for real exoplanets.",
    images: ["/og"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <StoreHydrator />
          <Nav />
          <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-6">{children}</main>
          <footer className="relative z-10 border-t border-hull py-6 text-center text-sm text-muted">
            <p>
              chromoforge · an educational simulation, not a wet-lab instruction manual · exoplanet
              data curated from the NASA Exoplanet Archive
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
