import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "격주 업무보고 수합판",
  description: "행정망 내부용 격주 업무보고 수합 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
