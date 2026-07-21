"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = {id:number; name:string; category:string; description:string; price:number; original_price?:number; discount_percent?:number; stock:number; image:string; featured:boolean};

async function optimizeImage(file: File) {
  if (file.type === "image/gif" || file.size < 350_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .82));
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {type:"image/webp"}) : file;
  } catch { return file; }
}

export default function ProductManager({ userEmail }: {userEmail:string}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  useEffect(() => { fetch(`/api/products?fresh=${Date.now()}`, {cache:"no-store"}).then((r) => r.json()).then((x) => setProducts(x.products || [])); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("Preparing product image…");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const token = sessionStorage.getItem("smartcommerce_admin_token");
    const image = formData.get("image");
    const uploadData = new FormData();
    if (image instanceof File) uploadData.append("image", await optimizeImage(image));
    setMessage("Uploading optimized image…");
    const controller = new AbortController();
    const uploadTimeout = window.setTimeout(() => controller.abort(), 45000);
    let uploadResponse: Response;
    try { uploadResponse = await fetch("/api/admin/upload", {method:"POST", headers:{Authorization:`Bearer ${token}`}, body:uploadData, signal:controller.signal}); }
    catch { window.clearTimeout(uploadTimeout); setBusy(false); setMessage("The image upload timed out. Try a smaller image or check your connection."); return; }
    window.clearTimeout(uploadTimeout);
    const upload = await uploadResponse.json();
    if (!uploadResponse.ok) { setBusy(false); setMessage(upload.error || "Could not upload this image."); return; }
    setMessage("Image uploaded. Saving product…");
    const values = Object.fromEntries(formData);
    const response = await fetch("/api/products", {method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body:JSON.stringify({...values, imageUrl:upload.url, price:Number(values.price), originalPrice:Number(values.originalPrice || 0), discountPercent:Number(values.discountPercent || 0), stock:Number(values.stock), featured:values.featured === "on"})});
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(data.error || "Could not save this product."); return; }
    setProducts((items) => [data, ...items]); setMessage("Product published to the storefront."); form.reset(); setPreview("");
  }

  return <div className="admin-content"><section className="admin-heading"><div><p className="eyebrow">Admin & staff workspace</p><h1>Bring a new product to life.</h1><p>Signed in as {userEmail}. Products save to the hosted database and appear on the public store.</p></div><div className="admin-stat"><strong>{products.length}</strong><span>Hosted products</span></div></section>
    <div className="admin-grid"><form className="product-form" onSubmit={submit}><h2>Add product</h2><div className="form-columns"><label>Product name<input name="name" required minLength={2} placeholder="Handwoven Market Tote"/></label><label>Category<select name="category" required><option>Clothing</option><option>Electronics</option><option>Accessories</option><option>Home</option><option>Beauty</option><option>Food</option></select></label><label>Selling price (MMK)<input name="price" type="number" min="1" required placeholder="35000"/></label><label>Original price (MMK)<input name="originalPrice" type="number" min="1" placeholder="45000"/></label><label>Discount (%)<input name="discountPercent" type="number" min="0" max="99" defaultValue="0"/></label><label>Stock quantity<input name="stock" type="number" min="0" required placeholder="10"/></label><label className="full upload-control"><span>Product image</span><div className="upload-box">{preview ? <img src={preview} alt="Selected product preview"/> : <span className="upload-icon">↑</span>}<div><strong>{preview ? "Image ready" : "Choose an image"}</strong><small>JPG, PNG, WebP, or GIF · maximum 5 MB</small></div><input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required onChange={(event) => { const file = event.target.files?.[0]; setPreview(file ? URL.createObjectURL(file) : ""); }}/></div></label><label className="full">Description<textarea name="description" required minLength={4} placeholder="Describe what makes this product useful…"/></label></div><label className="check"><input name="featured" type="checkbox"/> Feature on the storefront</label>{message && <p className={message.startsWith("Product") ? "success-message" : "error-message"}>{message}</p>}<button className="primary" disabled={busy}>{busy ? "Uploading & publishing…" : "Publish product →"}</button></form>
      <section className="inventory-list"><div className="list-head"><div><p className="eyebrow">Live inventory</p><h2>Recently added</h2></div><a href="/">View store ↗</a></div>{products.length ? products.map((p) => <article key={p.id}><img src={p.image} alt=""/><div><small>{p.category}</small><h3>{p.name}</h3><p>{new Intl.NumberFormat("en-US").format(p.price)} MMK · {p.stock} in stock</p></div></article>) : <div className="no-products"><span>✦</span><h3>Your hosted catalogue is ready.</h3><p>Add the first product with the form.</p></div>}</section>
    </div>
  </div>;
}
