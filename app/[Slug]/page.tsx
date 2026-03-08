"use client";

import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const slug = params?.slug;

  return (
    <main style={{ padding: 40 }}>
      <h1>Slug detectado:</h1>
      <p>{typeof slug === "string" ? slug : ""}</p>
    </main>
  );
}