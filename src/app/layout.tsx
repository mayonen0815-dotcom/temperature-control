import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UMAMI 従業員データ管理",
  description: "従業員データ管理・重点管理記録・書類提出の店舗管理システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen font-body">{children}</body>
    </html>
  );
}
