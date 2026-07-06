import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "現場管理",
  description: "温度管理・クレーム・書類提出の現場管理システム",
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
