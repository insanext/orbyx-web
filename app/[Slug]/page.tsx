"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/public-services/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
      });
  }, [slug]);

  return (
    <main style={{ padding: 40 }}>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}