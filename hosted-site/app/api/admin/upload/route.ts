import { env } from "cloudflare:workers";

type RuntimeEnv = { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string; SUPABASE_SERVICE_ROLE_KEY?: string };
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.SUPABASE_URL || !runtime.SUPABASE_ANON_KEY || !runtime.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Image storage is not configured." }, { status: 503 });
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const authResponse = await fetch(`${runtime.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: runtime.SUPABASE_ANON_KEY, Authorization: authorization }, cache: "no-store" });
  if (!authResponse.ok) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const user = await authResponse.json() as { app_metadata?: { role?: string } };
  if (!["admin", "staff", "super_admin"].includes(user.app_metadata?.role || "")) return Response.json({ error: "Admin or staff access is required." }, { status: 403 });

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File) || !file.size) return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  if (!allowedTypes.has(file.type)) return Response.json({ error: "Use a JPG, PNG, WebP, or GIF image." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: "The image must be smaller than 5 MB." }, { status: 400 });

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "product-image";
  const path = `products/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const uploadResponse = await fetch(`${runtime.SUPABASE_URL}/storage/v1/object/product-images/${path}`, { method: "POST", headers: { apikey: runtime.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${runtime.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": file.type, "x-upsert": "false" }, body: await file.arrayBuffer() });
  if (!uploadResponse.ok) return Response.json({ error: "The image could not be uploaded. Please try again." }, { status: 502 });
  return Response.json({ url: `${runtime.SUPABASE_URL}/storage/v1/object/public/product-images/${path}` }, { status: 201 });
}
