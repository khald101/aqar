import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "عِمارة | A'marah — نظام إدارة العقارات والأملاك",
  description: "نظام متكامل واحترافي لإدارة الأصول العقارية والأملاك والعقود والمستأجرين والتحصيلات والمحاسبة والصيانة",
  keywords: ["عقارات", "إدارة أملاك", "عمارة", "عقود إيجار", "صيانة", "محاسبة عقارية"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased font-['Cairo',sans-serif] selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
