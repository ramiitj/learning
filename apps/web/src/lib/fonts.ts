import { Noto_Sans, Noto_Sans_Telugu } from "next/font/google";

/**
 * Noto covers Latin, Devanagari and Telugu with matching metrics. Google's
 * Noto Sans family includes the Devanagari design as a subset, so Hindi needs
 * no separate family; Telugu has its own. Fonts are self-hosted by Next at
 * build time (no request to Google from learners' devices) and cached by the
 * service worker. Each subset is split by unicode-range, so a page downloads
 * only the scripts it shows; only Latin is preloaded.
 */
export const notoSans = Noto_Sans({ subsets: ["latin", "devanagari"], weight: ["400", "600", "700", "800"], variable: "--font-latin", display: "swap" });
export const notoTelu = Noto_Sans_Telugu({ subsets: ["telugu"], weight: ["400", "600", "700", "800"], variable: "--font-telu", display: "swap", preload: false });

export const fontVariables = [notoSans.variable, notoTelu.variable].join(" ");
