import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { AdminRole, AdminUser, Team, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTokenPair, hashToken } from "@/lib/tokens";

export const SESSION_COOKIE_NAME = "login_cookie_probe";
export const LEGACY_SESSION_COOKIE_NAME = "biweekly_report_session";
const SESSION_DAYS = 14;
export const SESSION_COOKIE_SECURE =
  process.env.SESSION_COOKIE_SECURE === "true" ||
  (process.env.SESSION_COOKIE_SECURE !== "false" &&
    (process.env.APP_BASE_URL ?? "").startsWith("https://"));

export type CurrentUser = AdminUser & { team: Team | null };

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [scheme, salt, stored] = passwordHash.split("$");
  if (scheme !== "scrypt" || !salt || !stored) return false;

  const storedBuffer = Buffer.from(stored, "base64url");
  const derivedBuffer = scryptSync(password, salt, storedBuffer.length);
  return (
    storedBuffer.length === derivedBuffer.length &&
    timingSafeEqual(storedBuffer, derivedBuffer)
  );
}

export async function ensureBootstrapSuperAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL ?? "");
  const password = process.env.ADMIN_INITIAL_PASSWORD ?? "";

  if (!email || !password) return;

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "super_admin" || existing.status !== "approved") {
      await prisma.adminUser.update({
        where: { id: existing.id },
        data: {
          role: "super_admin",
          status: "approved",
          approvedAt: existing.approvedAt ?? new Date(),
        },
      });
    }
    return;
  }

  await prisma.adminUser.create({
    data: {
      email,
      name: "Initial Admin",
      passwordHash: hashPassword(password),
      role: "super_admin",
      status: "approved",
      approvedAt: new Date(),
    },
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  await ensureBootstrapSuperAdmin();

  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIE_NAME)?.value ??
    cookieStore.get(LEGACY_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { adminUser: { include: { team: true } } },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }

  return session.adminUser;
}

export async function createSessionToken(adminUserId: string) {
  const token = createTokenPair();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      adminUserId,
      tokenHash: token.tokenHash,
      expiresAt,
    },
  });

  return { token: token.token, expiresAt };
}

export function getSessionCookieOptions(expiresAt: Date, secure = SESSION_COOKIE_SECURE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    expires: expiresAt,
  };
}

export async function createSession(adminUserId: string) {
  const session = await createSessionToken(adminUserId);

  const cookieStore = await cookies();
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const secure =
    process.env.SESSION_COOKIE_SECURE === "true" ||
    (process.env.SESSION_COOKIE_SECURE !== "false" && forwardedProto === "https");
  cookieStore.set(
    SESSION_COOKIE_NAME,
    session.token,
    getSessionCookieOptions(session.expiresAt, secure),
  );
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIE_NAME)?.value ??
    cookieStore.get(LEGACY_SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(LEGACY_SESSION_COOKIE_NAME);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    const cookieStore = await cookies();
    const headerStore = await headers();
    console.info("[auth] requireCurrentUser redirecting to login", {
      host: headerStore.get("host"),
      nextUrl: headerStore.get("next-url"),
      referer: headerStore.get("referer"),
      cookieNames: cookieStore.getAll().map((cookie) => cookie.name),
    });
    redirect("/login");
  }
  return user;
}

export async function requireApprovedUser() {
  const user = await requireCurrentUser();
  if (user.status !== "approved") redirect("/my");
  return user;
}

export function canWriteTeam(user: Pick<AdminUser, "role" | "status" | "teamId">, teamId: string) {
  return user.status === "approved" && user.role === "team_user" && user.teamId === teamId;
}

export function canEditTeamReport(
  user: Pick<AdminUser, "role" | "status" | "teamId" | "managedDepartmentName">,
  team: Pick<Team, "id" | "departmentName">,
) {
  if (user.status !== "approved") return false;
  if (canWriteTeam(user, team.id)) return true;
  return isAdminRole(user.role) && canManageDepartment(user, team.departmentName);
}

export async function requireAdminUser() {
  const user = await requireApprovedUser();
  if (!isAdminRole(user.role)) redirect("/my");
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAdminUser();
  if (user.role !== "super_admin") redirect("/admin");
  return user;
}

export function isAdminRole(role: AdminRole) {
  return role === "super_admin" || role === "department_manager";
}

export function canManageDepartment(user: Pick<AdminUser, "role" | "managedDepartmentName">, departmentName: string) {
  return user.role === "super_admin" || user.managedDepartmentName === departmentName;
}

export function roleLabel(role: AdminRole) {
  const labels: Record<AdminRole, string> = {
    super_admin: "전체관리자",
    department_manager: "과별관리자",
    team_user: "팀 작성자",
  };
  return labels[role];
}

export function statusLabel(status: UserStatus) {
  const labels: Record<UserStatus, string> = {
    pending: "승인 대기",
    approved: "승인",
    rejected: "거절",
  };
  return labels[status];
}
