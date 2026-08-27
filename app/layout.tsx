import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Familjen_Grotesk, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";

import { Masthead } from "@/components/masthead";
import { getProvider } from "@/lib/providers";
import { APP_DESCRIPTION, APP_NAME, STORAGE_KEY_THEME } from "@/lib/config";
import { SavedProvider } from "@/providers/saved-provider";

import "./globals.css";

const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-familjen",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — live world news`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070b13" },
    { media: "(prefers-color-scheme: light)", color: "#eef0f4" },
  ],
};

/**
 * Applies the stored theme before first paint so a light-theme reader never
 * sees a flash of the dark canvas. It has to be inline and synchronous to beat
 * the first paint, which is why <html> carries suppressHydrationWarning.
 */
const themeScript = `
(function(){
  try {
    var stored = localStorage.getItem(${JSON.stringify(STORAGE_KEY_THEME)});
    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.dataset.theme = stored || (prefersLight ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  const provider = getProvider();

  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${familjen.variable} ${sourceSerif.variable} ${plexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href={new URL(provider.homepage).origin} crossOrigin="" />
      </head>
      <body className="min-h-dvh">
        <SavedProvider>
          <a
            href="#feed"
            className="label absolute left-4 -top-12 z-[60] bg-foil px-4 py-2 text-foil-ink no-underline transition-[top] focus:top-3"
          >
            Skip to stories
          </a>

          <Masthead />
          {children}

          <footer className="border-t border-hair-soft py-6">
            <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-eyebrow text-mute">
              <span>
                Data:{" "}
                <a
                  href={provider.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dim underline decoration-hair underline-offset-[3px] transition-colors hover:text-foil"
                >
                  {provider.attribution}
                </a>
              </span>
              <span>Headlines and summaries belong to their publishers.</span>
              <span className="ml-auto">Times shown in UTC</span>
            </div>
          </footer>
        </SavedProvider>
      </body>
    </html>
  );
}
