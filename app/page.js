"use client";
import { analytics } from "../lib/firebase";
import { logEvent } from "firebase/analytics";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    if (analytics) logEvent(analytics, "page_view");
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>Firebase Connected!</h1>
      <p>Website kamu sudah terhubung Firebase.</p>
    </main>
  );
}
