import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";

export default async function Home() {
  const session = await getAdminSession();
  redirect(session ? "/admin" : "/admin/login");
}
