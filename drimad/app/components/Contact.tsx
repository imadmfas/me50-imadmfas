"use client";

import { motion } from "framer-motion";
import { FadeIn } from "./FadeIn";

const channels = [
  { icon: "✉️", label: "البريد الإلكتروني", value: "info@drimad.net", href: "mailto:info@drimad.net" },
  { icon: "💬", label: "واتساب", value: "+964 xxx xxx xxxx", href: "#" },
  { icon: "📘", label: "فيسبوك", value: "Dr. Imad Al-Dailami", href: "#" },
  { icon: "▶️", label: "يوتيوب", value: "قناة أ.د. عماد الديلمي", href: "#" },
  { icon: "🐦", label: "تويتر / X", value: "@drimad", href: "#" },
  { icon: "💼", label: "LinkedIn", value: "Prof. Imad Al-Dailami", href: "#" },
];

export function Contact() {
  return (
    <section id="contact" className="section-pad">
      <div className="container-rtl max-w-4xl">
        <FadeIn className="mb-12 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gold-500">
            التواصل
          </p>
          <h2 className="text-3xl font-black sm:text-4xl">
            <span className="text-gold-gradient">تواصل</span>{" "}
            <span className="text-silver-200">معي</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-silver-400">
            يسعدني التواصل للتعاون الأكاديمي، التدريب، المحاضرات، أو الاستشارات
          </p>
        </FadeIn>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((c, i) => (
            <FadeIn key={c.label} delay={i * 0.06}>
              <motion.a
                href={c.href}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="glass-card gold-border flex items-center gap-4 rounded-2xl p-5 text-right transition-all hover:border-gold-400/50 hover:shadow-gold-sm"
              >
                <span className="text-2xl shrink-0">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-silver-400">{c.label}</p>
                  <p className="truncate text-sm font-medium text-gold-300">{c.value}</p>
                </div>
              </motion.a>
            </FadeIn>
          ))}
        </div>

        {/* نموذج بسيط */}
        <FadeIn className="mt-12" delay={0.2}>
          <div className="glass-card gold-border rounded-2xl p-8 text-right">
            <h3 className="mb-6 text-lg font-bold text-gold-300">أرسل رسالة مباشرة</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="الاسم الكامل"
                className="rounded-xl border border-gold-500/25 bg-navy-800/60 px-4 py-3 text-sm text-silver-200 placeholder-silver-400/60 outline-none focus:border-gold-400/60 transition"
                dir="rtl"
              />
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                className="rounded-xl border border-gold-500/25 bg-navy-800/60 px-4 py-3 text-sm text-silver-200 placeholder-silver-400/60 outline-none focus:border-gold-400/60 transition"
                dir="rtl"
              />
            </div>
            <input
              type="text"
              placeholder="موضوع الرسالة"
              className="mt-4 w-full rounded-xl border border-gold-500/25 bg-navy-800/60 px-4 py-3 text-sm text-silver-200 placeholder-silver-400/60 outline-none focus:border-gold-400/60 transition"
              dir="rtl"
            />
            <textarea
              rows={4}
              placeholder="نص الرسالة..."
              className="mt-4 w-full rounded-xl border border-gold-500/25 bg-navy-800/60 px-4 py-3 text-sm text-silver-200 placeholder-silver-400/60 outline-none focus:border-gold-400/60 transition resize-none"
              dir="rtl"
            />
            <div className="mt-4 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-xl bg-gradient-gold px-8 py-3 text-sm font-bold text-navy-950 shadow-gold-sm transition hover:opacity-90"
              >
                إرسال الرسالة ✉️
              </motion.button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
