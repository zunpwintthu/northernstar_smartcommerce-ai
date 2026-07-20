import { requireChatGPTUser, chatGPTSignOutPath } from "../chatgpt-auth";
import ProductManager from "./product-manager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  return <main className="admin-page"><header className="admin-nav"><a href="/" className="brand"><span>SC</span><b>SmartCommerce</b></a><div><span>{user.displayName}</span><a href={chatGPTSignOutPath("/")}>Sign out</a></div></header><ProductManager userEmail={user.email}/></main>;
}
