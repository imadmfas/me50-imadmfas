"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FadeIn } from "./FadeIn";

const books = [
  {
    title: "الذكاء الاصطناعي بين الفلسفة والتطبيق",
    type: "كتاب مطبوع",
    year: "2024",
    color: "#d4a843",
    downloadable: true,
  },
  {
    title: "مقارنة الأديان في العصر الرقمي",
    type: "كتاب مطبوع",
    year: "2023",
    color: "#d4a843",
    downloadable: false,
  },
  {
    title: "ديوان — أصداء الروح",
    type: "ديوان شعر",
    year: "2022",
    color: "#3dd9c5",
    downloadable: true,
  },
  {
    title: "Python للباحثين العرب",
    type: "كتاب مترجم",
    year: "2023",
    color: "#8899aa",
    downloadable: true,
  },
  {
    title: "المذاهب الكلامية — قراءة معاصرة",
    type: "كتاب مطبوع",
    year: "2021",
    color: "#d4a843",
    downloadable: false,
  },
  {
    title: "ديوان — ضفاف النور",
    type: "ديوان شعر",
    year: "2020",
    color: "#3dd9c5",
    downloadable: true,
  },
];

export function Books() {
  return (
    <section id="books" className="section-pad bg-navy-900/30">
      <div className="container-rtl">
        <FadeIn className="mb-12 text-right">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gold-500">المؤلفات</p>
          <h2 className="text-3xl font-black sm:text-4xl">
            <span className="text-gold-gradient">الكتب</span>{" "}
            <span className="text-silver-200">والمؤلفات</span>
          </h2>
        </FadeIn>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b, i) => (
            <FadeIn key={b.title} delay={i * 0.07}>
              <motion.div
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="glass-card flex h-full flex-col rounded-2xl p-6 text-right"
                style={{ borderColor: `${b.color}30` }}
              >
                {/* نوع الكتاب */}
                <span
                  className="mb-4 self-end rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: `${b.color}18`, color: b.color, border: `1px solid ${b.color}40` }}
                >
                  {b.type}
                </span>

                {/* غلاف وهمي */}
                <div
                  className="mb-4 mx-auto h-36 w-24 rounded-lg flex items-center justify-center text-3xl"
                  style={{ background: `linear-gradient(135deg, ${b.color}22, ${b.color}08)`, border: `1px solid ${b.color}30` }}
                >
                  📖
                </div>

                <h3 className="mb-1 text-sm font-bold text-silver-200 leading-relaxed">
                  {b.title}
                </h3>
                <p className="mb-4 text-xs text-silver-400">{b.year}</p>

                {b.downloadable && (
                  <Link
                    href="#download"
                    className="mt-auto self-end rounded-full border border-gold-500/30 px-4 py-1.5 text-xs text-gold-400 transition hover:bg-gold-500/10"
                  >
                    تحميل مجاني ↓
                  </Link>
                )}
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
