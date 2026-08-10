import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "✦ CineAI Studio - Sản Xuất Video Điện Ảnh AI Chuyên Nghiệp",
  description: "Sản xuất video điện ảnh chuyên nghiệp với Gemini 3.1 Pro & Veo 3.1 AI Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`dark ${inter.variable} ${outfit.variable}`}>
      <body className="bg-[#09090b] text-zinc-100 antialiased min-h-screen font-sans">
        <Sidebar />
        <Navbar />
        <main className="pl-[240px] pt-16 min-h-screen">
          <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
