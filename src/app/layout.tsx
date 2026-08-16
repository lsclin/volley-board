import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Navbar } from "@/components/ui/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VolleyBoard - 排协赛事与活动",
  description: "排协赛事与活动信息中心：赛事进度、赛程、比分、排名与赛事资料",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">
        <Navbar />
        <main className="flex-1 md:ml-56 pb-20 md:pb-6 px-4 py-4 md:py-6 max-w-2xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
