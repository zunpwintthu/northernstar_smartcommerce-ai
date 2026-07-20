"use client";

import { useMemo, useState } from "react";

const products = [
  { id: 1, name: "Indigo Everyday Shirt", category: "Clothing", price: 35000, stock: 12, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&q=85", note: "Breathable cotton, relaxed fit." },
  { id: 2, name: "Pocket Bluetooth Speaker", category: "Electronics", price: 38000, old: 42000, stock: 4, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&q=85", note: "Small speaker, surprisingly full sound." },
  { id: 3, name: "Woven Market Tote", category: "Accessories", price: 28000, stock: 9, image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=900&q=85", note: "Roomy, durable, and made for every day." },
  { id: 4, name: "Quiet Morning Ceramic Set", category: "Home", price: 46000, stock: 7, image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=900&q=85", note: "Hand-finished ceramics for slow mornings." },
  { id: 5, name: "Everyday Wireless Earbuds", category: "Electronics", price: 49000, stock: 3, image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=900&q=85", note: "Clear calls and a pocket-sized charging case." },
  { id: 6, name: "Soft Cotton Overshirt", category: "Clothing", price: 41000, stock: 8, image: "https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?w=900&q=85", note: "An easy layer for changing weather." },
];

const money = (value: number) => `${new Intl.NumberFormat("en-US").format(value)} MMK`;

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const filtered = useMemo(() => products.filter((p) => (category === "All" || p.category === category) && `${p.name} ${p.note}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const cartProducts = cart.map((id) => products.find((p) => p.id === id)!);
  const total = cartProducts.reduce((sum, p) => sum + p.price, 0);

  function add(id: number) {
    setCart((items) => [...items, id]);
    setCartOpen(true);
  }

  return <>
    <header className="nav-shell">
      <a className="brand" href="#top"><span>SC</span><b>SmartCommerce</b></a>
      <nav><a href="#shop">Shop</a><a href="#how">How it works</a><a href="#ai">AI assistant</a></nav>
      <button className="bag" onClick={() => setCartOpen(true)} aria-label="Open shopping bag">Bag <span>{cart.length}</span></button>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Commerce that works everywhere</p>
          <h1>Thoughtful shopping,<br/><em>made beautifully simple.</em></h1>
          <p className="intro">Browse considered essentials, pay your way, and follow every order from checkout to your door—no conventional payment gateway required.</p>
          <div className="actions"><a className="primary" href="#shop">Explore the collection <span>→</span></a><a className="secondary" href="#ai">Ask SmartCommerce AI</a></div>
        </div>
        <div className="hero-visual" aria-hidden="true"><div className="orb"></div><div className="card card-one"><small>Flexible payments</small><b>Bank · Wallet · Cash</b></div><div className="card card-two"><small>Local delivery</small><b>Clear order tracking</b></div><div className="product-shape"><span></span></div></div>
      </section>

      <section className="trust"><span>Secure checkout</span><span>Flexible payments</span><span>Local support</span><span>Transparent delivery</span></section>

      <section className="shop section" id="shop">
        <div className="section-title"><div><p className="eyebrow">Freshly selected</p><h2>Find something useful.</h2></div><label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the collection" aria-label="Search products"/></label></div>
        <div className="filters">{["All", "Clothing", "Electronics", "Accessories", "Home"].map((c) => <button className={category === c ? "active" : ""} onClick={() => setCategory(c)} key={c}>{c}</button>)}</div>
        <div className="product-grid">{filtered.map((p) => <article className="product" key={p.id}>
          <div className="product-image"><img src={p.image} alt={p.name}/>{p.old && <span className="sale">Sale</span>}<button onClick={() => add(p.id)} aria-label={`Add ${p.name} to bag`}>＋</button></div>
          <p className="category">{p.category}</p><h3>{p.name}</h3><p className="note">{p.note}</p>
          <div className="price"><b>{money(p.price)}</b>{p.old && <s>{money(p.old)}</s>}<small>{p.stock <= 4 ? `Only ${p.stock} left` : "In stock"}</small></div>
        </article>)}</div>
        {!filtered.length && <div className="empty"><h3>No exact match yet.</h3><p>Try another search or browse all products.</p><button onClick={() => {setQuery(""); setCategory("All")}}>Show everything</button></div>}
      </section>

      <section className="how" id="how"><div><p className="eyebrow">A checkout built for real life</p><h2>Pay in the way that works for you.</h2><p>SmartCommerce is designed for communities where cards and global gateways are not always practical. Every order stays clear, personal, and easy to follow.</p></div><ol><li><span>01</span><div><b>Choose your favourites</b><p>Live stock checks keep every cart honest.</p></div></li><li><span>02</span><div><b>Select a manual payment</b><p>Choose cash, bank transfer, mobile wallet, or pay at shop.</p></div></li><li><span>03</span><div><b>Track every step</b><p>Receive a reference and follow the order through delivery.</p></div></li></ol></section>

      <section className="ai" id="ai"><div className="spark">✦</div><p className="eyebrow">Grounded in real store data</p><h2>Meet your shopping assistant.</h2><p>Ask about products, availability, delivery, or payment. SmartCommerce AI uses controlled business tools so prices and stock are never invented.</p><div className="prompt"><span>Show me products below 50,000 MMK</span><button onClick={() => {setQuery(""); setCategory("All"); document.querySelector("#shop")?.scrollIntoView({behavior:"smooth"})}}>→</button></div></section>
    </main>

    <footer><div className="brand"><span>SC</span><b>SmartCommerce</b></div><p>Flexible commerce for connected communities.</p><a href="https://github.com/zunpwintthu/northernstar_smartcommerce-ai">View the full project on GitHub ↗</a></footer>

    <div className={`overlay ${cartOpen ? "show" : ""}`} onClick={() => setCartOpen(false)}></div>
    <aside className={`drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen}><div className="drawer-head"><div><p className="eyebrow">Your selection</p><h2>Shopping bag</h2></div><button onClick={() => setCartOpen(false)}>×</button></div>
      {!cart.length ? <div className="cart-empty"><span>◇</span><h3>Your bag is waiting.</h3><p>Add a considered essential from the collection.</p><button className="primary" onClick={() => setCartOpen(false)}>Keep browsing</button></div> : <><div className="cart-items">{cartProducts.map((p, index) => <div className="cart-line" key={`${p.id}-${index}`}><img src={p.image} alt=""/><div><b>{p.name}</b><small>{money(p.price)}</small></div><button onClick={() => setCart((items) => items.filter((_, i) => i !== index))}>×</button></div>)}</div><div className="cart-total"><div><span>Subtotal</span><b>{money(total)}</b></div><p>Delivery is calculated at checkout.</p><button className="primary" onClick={() => alert("Demo checkout: the full FastAPI checkout flow is available in the GitHub repository.")}>Continue to checkout →</button></div></>}
    </aside>
  </>;
}
