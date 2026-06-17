"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, normalizeEmail, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: normalizeEmail(parsed.data.email) },
  });

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    redirect("/login?error=invalid");
  }

  await createSession(user.id);

  if (user.role === "team_user") {
    redirect("/my");
  }

  redirect("/admin");
}
