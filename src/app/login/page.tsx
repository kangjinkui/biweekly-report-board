import Link from "next/link";
import { LogIn } from "lucide-react";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { getCurrentUser, isAdminRole } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user?.status === "approved") {
    redirect(isAdminRole(user.role) ? "/admin" : "/my");
  }

  const { error } = await searchParams;

  return (
    <PageShell title="로그인" description="승인된 계정으로 업무보고 수합판에 접속합니다." maxWidth="max-w-xl">
      <form action="/api/login" method="post" className="gov-panel grid gap-4 p-5">
        {error ? (
          <div className="border border-[#f4b4ad] bg-[#fff4f2] px-3 py-2 text-sm text-[#b42318]">
            이메일 또는 비밀번호를 확인하세요.
          </div>
        ) : null}
        <label>
          <span className="mb-2 block text-sm font-semibold">이메일</span>
          <input name="email" type="email" className="w-full border border-[#c8d3df] px-3 py-2" required />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold">비밀번호</span>
          <input name="password" type="password" className="w-full border border-[#c8d3df] px-3 py-2" required />
        </label>
        <button className="gov-action inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold">
          <LogIn className="h-4 w-4" aria-hidden />
          로그인
        </button>
        <Link href="/signup" className="text-center text-sm font-semibold text-[#005bac]">
          계정 신청
        </Link>
      </form>
    </PageShell>
  );
}
