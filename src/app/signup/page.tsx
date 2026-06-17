import Link from "next/link";
import { UserPlus } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/prisma";
import { signup } from "./actions";
import { TeamSelect } from "./team-select";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams;
  const teams = await prisma.team.findMany({
    where: { isActive: true },
    orderBy: [{ departmentName: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, departmentName: true },
  });

  return (
    <PageShell title="계정 신청" description="소속 과와 팀을 선택해 작성자 계정을 신청합니다." maxWidth="max-w-xl">
      <form action={signup} className="gov-panel grid gap-4 p-5">
        {error ? <SignupError error={error} /> : null}
        <label>
          <span className="mb-2 block text-sm font-semibold">이름</span>
          <input name="name" className="w-full border border-[#c8d3df] px-3 py-2" required />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold">이메일</span>
          <input name="email" type="email" className="w-full border border-[#c8d3df] px-3 py-2" required />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold">비밀번호</span>
          <input
            name="password"
            type="password"
            minLength={8}
            className="w-full border border-[#c8d3df] px-3 py-2"
            required
          />
        </label>
        <TeamSelect teams={teams} />
        <button className="gov-action inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold">
          <UserPlus className="h-4 w-4" aria-hidden />
          계정 신청
        </button>
        <Link href="/login" className="text-center text-sm font-semibold text-[#005bac]">
          로그인으로 돌아가기
        </Link>
      </form>
    </PageShell>
  );
}

function SignupError({ error }: { error: string }) {
  const message =
    error === "duplicate"
      ? "이미 가입된 이메일입니다."
      : error === "team"
        ? "선택한 과와 팀 정보를 확인하세요."
        : "입력값을 확인하세요. 비밀번호는 8자 이상이어야 합니다.";

  return (
    <div className="border border-[#f4b4ad] bg-[#fff4f2] px-3 py-2 text-sm text-[#b42318]">
      {message}
    </div>
  );
}
