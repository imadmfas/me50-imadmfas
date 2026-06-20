"use client";

import { motion } from "framer-motion";
import { FadeIn } from "./FadeIn";

const apps = [
  { name: "مساعد القرآن الكريم", desc: "تطبيق تفاعلي للبحث والتلاوة بتقنية AI", icon: "📖", store: "Google Play" },
  { name: "تعلّم Python بالعربية", desc: "تعليم لغة بايثون للمبتدئين العرب خطوة بخطوة", icon: "🐍", store: "Google Play" },
  { name: "المذاهب الإسلامية", desc: "مرجع شامل في علم الكلام والمذاهب", icon: "🕌", store: "Google Play" },
  { name: "محاضراتي", desc: "تطبيق لمتابعة المحاضرات والمواد الأكاديمية", icon: "🎓", store: "Google Play" },
  { name: "الذكاء الاصطناعي للجميع", desc: "دليل تفاعلي تعريفي بالذكاء الاصطناعي", icon: "🤖", store: "Google Play" },
  { name: "ديوان الشعر", desc: "تطبيق يضم القصائد والمقطوعات الأدبية", icon: "✍️", store: "Google Play" },
  { name: "مؤتمراتي", desc: "أرشيف المؤتمرات والأبحاث المقدّمة", icon: "🏛", store: "Google Play" },
];

export function Apps() {
  return (
    <section id="apps" className="section-pad">
      <div className="container-rtl">
        <FadeIn className="mb-12 text-right">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gold-500">التطبيقات</p>
          <h2 className="text-3xl font-black sm:text-4xl">
            <span className="text-gold-gradient">7 تطبيقات</span>{" "}
            <span className="text-silver-200">على متجر أندرويد</span>
          </h2>
        </FadeIn>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {apps.map((app, i) => (
            <FadeIn key={app.name} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="glass-card gold-border flex flex-col rounded-2xl p-5 text-right"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full border border-gold-500/25 px-2 py-0.5 text-[10px] text-silver-400">
                    {app.store}
                  </span>
                  <span className="text-3xl">{app.icon}</span>
                </div>
                <h3 className="mb-1 text-sm font-bold text-gold-300">{app.name}</h3>
                <p className="text-xs leading-relaxed text-silver-400">{app.desc}</p>
                <button className="mt-4 self-end rounded-full bg-gold-500/15 border border-gold-500/30 px-4 py-1.5 text-xs text-gold-400 transition hover:bg-gold-500/25">
                  تحميل ↗
                </button>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
