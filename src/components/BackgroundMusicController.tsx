"use client";

import { useEffect } from "react";
import { armBgmAutoResume } from "@/lib/bgm";

// Renders nothing — just arms the autoplay-policy workaround once per app
// load so previously-enabled background music resumes on the visitor's
// first interaction with the page, on any route.
export default function BackgroundMusicController() {
  useEffect(() => {
    armBgmAutoResume();
  }, []);

  return null;
}
