"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = {id:number; name:string; category:string; description:string; price:number; stock:number; image:string; featured:boolean};

export default function ProductManager({ userEmail }: {userEmail:string}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/products").then((r) => r.json()).then((x) => setProducts(x.products || [])); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/products", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...values, price:Number(values.price), stock:Number(values.stock), featured:values.featured === "on"})});
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(data.error || "Could not save this product."); return; }
    setProducts((items) => [data, ...items]); setMessage("Product published to the storefront."); form.reset();
  }

  return <div className="admin-content"><section className="admin-heading"><div><p className="eyebrow">Admin & staff workspace</p><h1>Bring a new product to life.</h1><p>Signed in as {userEmail}. Products save to the hosted database and appear on the public store.</p></div><div className="admin-stat"><strong>{products.length}</strong><span>Hosted products</span></div></section>
    <div className="admin-grid"><form className="product-form" onSubmit={submit}><h2>Add product</h2><div className="form-columns"><label>Product name<input name="name" required minLength={2} placeholder="Handwoven Market Tote"/></label><label>Category<select name="category" required><option>Clothing</option><option>Electronics</option><option>Accessories</option><option>Home</option><option>Beauty</option><option>Food</option></select></label><label>Price (MMK)<input name="price" type="number" min="1" required placeholder="35000"/></label><label>Stock quantity<input name="stock" type="number" min="0" required placeholder="10"/></label><label className="full">Image URL<input name="imageUrl" type="url" required placeholder="https://images.example.com/product.jpg"/></label><label className="full">Description<textarea name="description" required minLength={4} placeholder="Describe what makes this product useful…"/></label></div><label className="check"><input name="featured" type="checkbox"/> Feature on the storefront</label>{message && <p className={message.startsWith("Product") ? "success-message" : "error-message"}>{message}</p>}<button className="primary" disabled={busy}>{busy ? "Publishing…" : "Publish product →"}</button></form>
      <section className="inventory-list"><div className="list-head"><div><p className="eyebrow">Live inventory</p><h2>Recently added</h2></div><a href="/">View store ↗</a></div>{products.length ? products.map((p) => <article key={p.id}><img src={p.image} alt=""/><div><small>{p.category}</small><h3>{p.name}</h3><p>{new Intl.NumberFormat("en-US").format(p.price)} MMK · {p.stock} in stock</p></div></article>) : <div className="no-products"><span>✦</span><h3>Your hosted catalogue is ready.</h3><p>Add the first product with the form.</p></div>}</section>
    </div>
  </div>;
}
