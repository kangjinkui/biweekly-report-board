import { redirect } from "next/navigation";
import { destroyCurrentSession } from "@/lib/auth";

export async function POST() {
  await destroyCurrentSession();
  redirect("/login");
}
