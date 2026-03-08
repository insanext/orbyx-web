export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const res = await fetch(
    `https://orbyx-backend.onrender.com/public/services/${slug}`,
    { cache: "no-store" }
  );

  const data = await res.json();

  return Response.json(data, { status: res.status });
}