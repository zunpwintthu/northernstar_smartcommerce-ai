import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartCommerce AI — Commerce that works everywhere",
  description: "A flexible AI-assisted commerce platform built for manual payments, local delivery, and connected communities.",
  metadataBase: new URL("https://northernstar-smartcommerce-ai.sites.openai.com"),
  openGraph: { title: "SmartCommerce AI", description: "Commerce that works everywhere", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "SmartCommerce AI", description: "Commerce that works everywhere", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
