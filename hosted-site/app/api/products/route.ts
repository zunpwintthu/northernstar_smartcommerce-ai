import { env } from "cloudflare:workers";

type RuntimeEnv = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

function config() {
  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.SUPABASE_URL || !runtime.SUPABASE_ANON_KEY) throw new Error("Supabase is not configured yet.");
  return runtime;
}

async function authenticatedStaff(request: Request, runtime: RuntimeEnv) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const response = await fetch(`${runtime.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: runtime.SUPABASE_ANON_KEY!, Authorization: authorization }, cache: "no-store" });
  if (!response.ok) return null;
  const user = await response.json() as {id:string; email?:string; app_metadata?:{role?:string}};
  return ["admin", "staff", "super_admin"].includes(user.app_metadata?.role || "") ? user : null;
}

export async function GET() {
  try {
    const runtime = config();
    const response = await fetch(`${runtime.SUPABASE_URL}/rest/v1/products?select=id,name,slug,category,description,price,original_price,discount_percent,stock,image_url,featured&active=eq.true&order=created_at.desc`, { headers: { apikey: runtime.SUPABASE_ANON_KEY!, Authorization: `Bearer ${runtime.SUPABASE_ANON_KEY}` }, cache: "no-store" });
    if (!response.ok) throw new Error("Supabase product query failed.");
    const rows = await response.json() as Array<Record<string, unknown>>;
    return Response.json({ products: rows.map((p) => ({...p, image: p.image_url})) }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return Response.json({ products: [], setupRequired: true, error: error instanceof Error ? error.message : "Database unavailable" }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}

export async function POST(request: Request) {
  const runtime = config();
  const user = await authenticatedStaff(request, runtime);
  if (!user) return Response.json({ error: "A valid admin or staff login is required." }, { status: 401 });
  if (!runtime.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Supabase server credentials are not configured." }, { status: 503 });
  const body = await request.json() as Record<string, unknown>;
  const name = String(body.name || "").trim(), category = String(body.category || "").trim(), description = String(body.description || "").trim(), imageUrl = String(body.imageUrl || "").trim();
  const price = Number(body.price), originalPrice = Number(body.originalPrice || 0), discountPercent = Number(body.discountPercent || 0), stock = Number(body.stock);
  if (name.length < 2 || !category || description.length < 4 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 99 || (originalPrice > 0 && originalPrice < price)) return Response.json({ error: "Please provide valid product and sale details." }, { status: 400 });
  try { new URL(imageUrl); } catch { return Response.json({ error: "Image URL must be a valid web address." }, { status: 400 }); }
  const product = { name, slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`, category, description, price, original_price: originalPrice > 0 ? originalPrice : null, discount_percent: discountPercent, stock, image_url: imageUrl, featured: Boolean(body.featured), active: true, created_by: user.email || user.id };
  const response = await fetch(`${runtime.SUPABASE_URL}/rest/v1/products`, { method: "POST", headers: { apikey: runtime.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${runtime.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(product) });
  if (!response.ok) return Response.json({ error: "Supabase could not save this product." }, { status: 502 });
  const [saved] = await response.json() as Array<Record<string, unknown>>;
  return Response.json({...saved, image: saved.image_url}, { status: 201 });
}
