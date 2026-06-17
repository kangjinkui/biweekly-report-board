"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, normalizeEmail } from "@/lib/auth";
import { DEPARTMENT_NAMES } from "@/lib/organization";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  departmentName: z.enum(DEPARTMENT_NAMES),
  teamId: z.string().uuid(),
});

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    departmentName: formData.get("departmentName"),
    teamId: formData.get("teamId"),
  });

  if (!parsed.success) {
    redirect("/signup?error=invalid");
  }

  const team = await prisma.team.findFirst({
    where: {
      id: parsed.data.teamId,
      departmentName: parsed.data.departmentName,
      isActive: true,
    },
    select: { id: true },
  });

  if (!team) {
    redirect("/signup?error=team");
  }

  const email = normalizeEmail(parsed.data.email);
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    redirect("/signup?error=duplicate");
  }

  await prisma.adminUser.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: hashPassword(parsed.data.password),
      role: "team_user",
      status: "pending",
      teamId: team.id,
    },
  });

  redirect("/login?signup=pending");
}
