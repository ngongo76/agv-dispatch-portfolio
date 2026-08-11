import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AGV Dispatch Dashboard — Portfolio Prototype",
  description: "Mô phỏng hệ thống điều phối AGV trong kho, kèm AI Dispatcher (Claude API).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
