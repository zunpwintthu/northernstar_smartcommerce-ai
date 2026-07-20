import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

type RuntimeEnv = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ADMIN_EMAILS?: string;
  STAFF_EMAILS?: string;
};

function config() {
  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.SUPABASE_URL || !runtime.SUPABASE_ANON_KEY) throw new Error("Supabase is not configured yet.");
  return runtime;
}

function allowed(email: string, runtime: RuntimeEnv) {
  const users = `${runtime.ADMIN_EMAILS || ""},${runtime.STAFF_EMAILS || ""}`.toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);
  return users.includes(email.toLowerCase());
}

export async function GET() {
  try {
    const runtime = config();
    const response = await fetch(`${runtime.SUPABASE_URL}/rest/v1/products?select=id,name,slug,category,description,price,stock,image_url,featured&active=eq.true&order=created_at.desc`, { headers: { apikey: runtime.SUPABASE_ANON_KEY!, Authorization: `Bearer ${runtime.SUPABASE_ANON_KEY}` }, cache: "no-store" });
    if (!response.ok) throw new Error("Supabase product query failed.");
    const rows = await response.json() as Array<Record<string, unknown>>;
    return Response.json({ products: rows.map((p) => ({...p, image: p.image_url})) });
  } catch (error) {
    return Response.json({ products: [], setupRequired: true, error: error instanceof Error ? error.message : "Database unavailable" });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  const runtime = config();
  if (!allowed(user.email, runtime)) return Response.json({ error: "Your account does not have admin or staff access." }, { status: 403 });
  if (!runtime.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Supabase server credentials are not configured." }, { status: 503 });
  const body = await request.json() as Record<string, unknown>;
  const name = String(body.name || "").trim(), category = String(body.category || "").trim(), description = String(body.description || "").trim(), imageUrl = String(body.imageUrl || "").trim();
  const price = Number(body.price), stock = Number(body.stock);
  if (name.length < 2 || !category || description.length < 4 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) return Response.json({ error: "Please provide valid product details." }, { status: 400 });
  try { new URL(imageUrl); } catch { return Response.json({ error: "Image URL must be a valid web address." }, { status: 400 }); }
  const product = { name, slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`, category, description, price, stock, image_url: imageUrl, featured: Boolean(body.featured), active: true, created_by: user.email };
  const response = await fetch(`${runtime.SUPABASE_URL}/rest/v1/products`, { method: "POST", headers: { apikey: runtime.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${runtime.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(product) });
  if (!response.ok) return Response.json({ error: "Supabase could not save this product." }, { status: 502 });
  const [saved] = await response.json() as Array<Record<string, unknown>>;
  return Response.json({...saved, image: saved.image_url}, { status: 201 });
}
