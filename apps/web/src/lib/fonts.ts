import { Noto_Sans, Noto_Sans_Devanagari, Noto_Sans_Telugu } from "next/font/google";

/**
 * Noto covers Latin, Devanagari and Telugu with matching metrics. Fonts are
 * self-hosted by Next at build time (no request to Google from learners'
 * devices) and cached by the service worker for offline use. Only the Latin
 * face is preloaded; Indic faces load when a page uses that script.
 */
export const notoLatin = Noto_Sans({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-latin", display: "swap" });
export const notoDeva = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "600", "700", "800"], variable: "--font-deva", display: "swap", preload: false });
export const notoTelu = Noto_Sans_Telugu({ subsets: ["telugu"], weight: ["400", "600", "700", "800"], variable: "--font-telu", display: "swap", preload: false });

export const fontVariables = [notoLatin.variable, notoDeva.variable, notoTelu.variable].join(" ");
