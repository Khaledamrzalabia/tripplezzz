"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_STORE_SETTINGS, type SiteMediaSettings } from "../types/settings";

// Site images chosen in the admin, provided once by the root layout to client components
const SiteMediaContext = createContext<SiteMediaSettings>(DEFAULT_STORE_SETTINGS.media);

export function SiteMediaProvider({ media, children }: { media: SiteMediaSettings; children: ReactNode }) {
  return <SiteMediaContext.Provider value={media}>{children}</SiteMediaContext.Provider>;
}

export function useSiteMedia(): SiteMediaSettings {
  return useContext(SiteMediaContext);
}
