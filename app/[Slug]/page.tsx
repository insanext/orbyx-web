export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main style={{ padding: 40 }}>
      <h1>Slug detectado:</h1>
      <p>{slug}</p>
    </main>
  );
}