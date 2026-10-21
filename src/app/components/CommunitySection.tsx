"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Props {
  images: string[];
}

export default function CommunitySection({ images }: Props) {
  const [instagramUrl, setInstagramUrl] = useState("https://www.instagram.com/triplez1606/");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.social?.instagram) setInstagramUrl(data.social.instagram);
      })
      .catch(() => {});
  }, []);
  return (
    <section className="section mockup-community-section" aria-label="Community lookbook">
      <div className="site-container">
        <div className="mockup-community-grid">
          {/* 5 Photos */}
          {images.map((src, idx) => (
            <div key={idx} className="mockup-community-tile">
              <Image
                src={src}
                alt={`Triple Z community member ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}

          {/* 6th Tile: Join the Movement CTA */}
          <div className="mockup-community-tile mockup-community-cta">
            <div>
              <p className="community-cta-eyebrow">JOIN THE MOVEMENT</p>
              <h3 className="community-cta-tag">#TRIPLEZ</h3>
              <p className="community-cta-desc">
                Real people. Real style. Tag us to be featured.
              </p>
            </div>
            <Link href={instagramUrl} target="_blank" rel="noopener noreferrer" className="community-arrow-btn" aria-label="Follow us on Instagram">
              →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
