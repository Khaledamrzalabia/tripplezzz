import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
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
        src: "/brand-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
