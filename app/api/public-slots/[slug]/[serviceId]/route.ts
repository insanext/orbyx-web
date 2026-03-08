export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; serviceId: string }> }
) {
  const { slug, serviceId } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const res = await fetch(
    `https://orbyx-backend.onrender.com/public/slots/${slug}/${serviceId}?date=${date}`,
    { cache: "no-store" }
  );

  const data = await res.json();

  return Response.json(data, { status: res.status });
}