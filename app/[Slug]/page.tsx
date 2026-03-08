export default function Page({ params }: { params: { slug: string } }) {
  return (
    <main style={{ padding: 40 }}>
      <h1>Slug detectado:</h1>
      <p>{params.slug}</p>
    </main>
  );
}