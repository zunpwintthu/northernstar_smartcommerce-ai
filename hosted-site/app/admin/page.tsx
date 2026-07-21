"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductManager from "./product-manager";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{email:string; role:string} | null>(null);
  useEffect(() => {
    const token = sessionStorage.getItem("smartcommerce_admin_token");
    if (!token) { router.replace("/admin/login"); return; }
    fetch("/api/admin/me", {headers:{Authorization:`Bearer ${token}`}}).then(async (response) => {
      if (!response.ok) { sessionStorage.removeItem("smartcommerce_admin_token"); router.replace("/admin/login"); return; }
      setUser(await response.json());
    });
  }, [router]);
  if (!user) return <main className="admin-loading"><div className="spark">✦</div><p>Opening your workspace…</p></main>;
  return <main className="admin-page"><header className="admin-nav"><a href="/" className="brand"><img src="https://wabakdrotuavrlqyudog.supabase.co/storage/v1/object/public/product-images/brand/northern-star-logo.png" alt="Northern Star logo"/><b>SmartCommerce</b></a><div><span>{user.email} · {user.role}</span><button onClick={() => {sessionStorage.removeItem("smartcommerce_admin_token"); router.replace("/admin/login")}}>Sign out</button></div></header><ProductManager userEmail={user.email}/></main>;
}
