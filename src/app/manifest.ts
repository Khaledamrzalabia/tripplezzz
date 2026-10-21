import type { MetadataRoute } from "next";
import { getCachedStoreSettings } from "../lib/settings.server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // App icon follows the logo chosen in the admin "Content & Media" tab
  const { media } = await getCachedStoreSettings();

  return {
    name: "Triple Z — Football Streetwear",
    short_name: "Triple Z",
    description: "Premium football streetwear combining contemporary fashion and culture.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: media.logo,
        sizes: "any",
      },
    ],
  };
}
