"use client";

import { motion } from "framer-motion";
import { FadeIn } from "./FadeIn";

const papers = [
  {
    title: "تطبيقات الذكاء الاصطناعي في الدراسات الدينية المقارنة",
    journal: "مجلة الدراسات الإسلامية والعلوم الإنسانية",
    year: "2024",
    tags: ["ذكاء اصطناعي", "دراسات دينية"],
  },
  {
    title: "نماذج اللغة الكبيرة وإمكانية توظيفها في التفسير القرآني",
    journal: "مؤتمر التقنية والعلوم الإسلامية — بغداد",
    year: "2024",
    tags: ["LLM", "قرآن كريم", "NLP"],
  },
  {
    title: "الهوية الرقمية والمذهب الكلامي — مقاربة فلسفية",
    journal: "مجلة الفكر والحضارة — الفلوجة",
    year: "2023",
    tags: ["فلسفة", "هوية رقمية"],
  },
  {
    title: "Python في خدمة البحث الأكاديمي العربي",
    journal: "المؤتمر الدولي للتعليم والتقنية",
    year: "2023",
    tags: ["Python", "بحث أكاديمي"],
  },
];

export function Research() {
  return (
    <section id="research" className="section-pad">
      <div className="container-rtl">
        <FadeIn className="mb-12 text-right">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gold-500">البحوث</p>
          <h2 className="text-3xl font-black sm:text-4xl">
            <span className="text-gold-gradient">البحوث</span>{" "}
            <span className="text-silver-200">المنشورة والمقدّمة</span>
          </h2>
        </FadeIn>

        <div className="grid gap-5 sm:grid-cols-2">
          {papers.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="glass-card gold-border flex h-full flex-col rounded-2xl p-6 text-right"
              >
                <h3 className="mb-2 text-base font-bold leading-relaxed text-gold-300">
                  {p.title}
                </h3>
                <p className="mb-4 text-xs text-silver-400">{p.journal}</p>
                <div className="mt-auto flex flex-wrap justify-end gap-2">
                  <span className="rounded-full bg-navy-700 px-2.5 py-0.5 text-[10px] text-silver-400">
                    {p.year}
                  </span>
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-teal-400/25 bg-teal-400/10 px-2.5 py-0.5 text-[10px] text-teal-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
