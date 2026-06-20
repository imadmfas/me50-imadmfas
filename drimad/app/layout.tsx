import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "أ.د. عماد محمد فرحان الديلمي — الموقع الرسمي",
  description:
    "الموقع الرسمي للأستاذ الدكتور عماد محمد فرحان الديلمي — باحث في الذكاء الاصطناعي ولغة بايثون، أستاذ في مقارنة الأديان والمذاهب الكلامية، الفلوجة — العراق.",
  openGraph: {
    title: "أ.د. عماد محمد فرحان الديلمي",
    description: "باحث في الذكاء الاصطناعي · أستاذ جامعي · مؤلف · مدرّب دولي",
    type: "website",
    locale: "ar_IQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body className={`${tajawal.variable} antialiased`}>{children}</body>
    </html>
  );
}
