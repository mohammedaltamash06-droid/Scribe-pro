export async function GET() {
  return Response.json({
    ok: true,
    engine: process.env.TRANSCRIBE_ENGINE,
    base: process.env.TRANSCRIBE_BASE_URL,
  });
}
