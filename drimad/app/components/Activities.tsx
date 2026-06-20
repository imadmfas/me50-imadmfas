"use client";

import { motion } from "framer-motion";
import { FadeIn } from "./FadeIn";

const activities = [
  { icon: "🎤", title: "مؤتمر الذكاء الاصطناعي — بغداد 2024", type: "مؤتمر دولي", detail: "ورقة بحثية حول NLP العربي" },
  { icon: "🏫", title: "ورشة Python للمعلمين — الفلوجة", type: "ورشة عمل", detail: "تدريب 60 معلماً على أساسيات البرمجة" },
  { icon: "📺", title: "لقاء تلفزيوني — قناة الفلوجة", type: "إعلام", detail: "الذكاء الاصطناعي وأثره على التعليم" },
  { icon: "🌍", title: "مؤتمر التقنية والإسلام — تركيا", type: "مؤتمر دولي", detail: "محاضرة: الهوية الرقمية في الفقه الإسلامي" },
  { icon: "📚", title: "حفل توقيع كتاب — جامعة الأنبار", type: "ثقافي", detail: "إطلاق كتاب الذكاء الاصطناعي بين الفلسفة والتطبيق" },
  { icon: "🎓", title: "تدريب الكوادر الجامعية — وزارة التعليم", type: "تدريب", detail: "برنامج التحول الرقمي للجامعات العراقية" },
];

const typeColors: Record<string, string> = {
  "مؤتمر دولي": "#d4a843",
  "ورشة عمل": "#3dd9c5",
  "إعلام": "#8899aa",
  "ثقافي": "#d4a843",
  "تدريب": "#3dd9c5",
};

export function Activities() {
  return (
    <section id="activities" className="section-pad bg-navy-900/30">
      <div className="container-rtl">
        <FadeIn className="mb-12 text-right">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gold-500">النشاطات</p>
          <h2 className="text-3xl font-black sm:text-4xl">
            <span className="text-gold-gradient">النشاطات</span>{" "}
            <span className="text-silver-200">والفعاليات</span>
          </h2>
        </FadeIn>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a, i) => (
            <FadeIn key={a.title} delay={i * 0.07}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="glass-card rounded-2xl p-6 text-right"
                style={{ borderColor: `${typeColors[a.type] ?? "#d4a843"}25` }}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                    style={{
                      background: `${typeColors[a.type] ?? "#d4a843"}18`,
                      color: typeColors[a.type] ?? "#d4a843",
                      border: `1px solid ${typeColors[a.type] ?? "#d4a843"}40`,
                    }}
                  >
                    {a.type}
                  </span>
                  <span className="text-2xl">{a.icon}</span>
                </div>
                <h3 className="mb-1 text-sm font-bold text-silver-200 leading-relaxed">{a.title}</h3>
                <p className="text-xs text-silver-400">{a.detail}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
