"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter(); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const values=Object.fromEntries(new FormData(event.currentTarget));const response=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});const data=await response.json();setBusy(false);if(!response.ok){setError(data.error||"Login failed.");return;}sessionStorage.setItem("smartcommerce_admin_token",data.access_token);router.replace("/admin");}
  return <main className="login-page"><a href="/" className="brand"><img src="https://wabakdrotuavrlqyudog.supabase.co/storage/v1/object/public/product-images/brand/northern-star-logo.png" alt="Northern Star logo"/><b>SmartCommerce</b></a><div className="login-card"><div className="login-art"><p className="eyebrow">Team access</p><h1>Manage the store with confidence.</h1><p>Add products, update inventory, and keep the catalogue moving.</p><div className="login-orbit"><span>✦</span></div></div><form onSubmit={submit}><p className="eyebrow">Admin & staff portal</p><h2>Welcome back.</h2><p>Use your SmartCommerce team credentials.</p><label>Email address<input name="email" type="email" required autoComplete="username"/></label><label>Password<input name="password" type="password" required autoComplete="current-password"/></label>{error&&<p className="error-message">{error}</p>}<button className="primary" disabled={busy}>{busy?"Signing in…":"Sign in securely →"}</button><a href="/">← Return to storefront</a></form></div></main>;
}
