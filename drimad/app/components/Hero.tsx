"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const roles = [
  "باحث أكاديمي",
  "خبير ذكاء اصطناعي",
  "مدرّب دولي",
  "مترجم",
  "شاعر",
  "مصوّر",
];

const ctaButtons = [
  { label: "+ البحوث المنشورة", href: "#research", primary: true },
  { label: "تحميل الكتب", href: "#download", primary: false },
  { label: "المؤلفات 📚", href: "#books", primary: false },
  { label: "✉ تواصل معي", href: "#contact", primary: false },
];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen overflow-hidden bg-gradient-hero flex items-center"
    >
      {/* خلفية ديكورية */}
      <div className="pointer-events-none absolute inset-0">
        {/* دائرة ذهبية كبيرة */}
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-500/5" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-500/8" />
        {/* توهج */}
        <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-gold-500/5 blur-[100px]" />
        <div className="absolute left-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-teal-500/8 blur-[80px]" />
        {/* نجوم صغيرة */}
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-0.5 w-0.5 rounded-full bg-gold-300/40"
            style={{
              top: `${10 + ((i * 37) % 80)}%`,
              right: `${5 + ((i * 53) % 90)}%`,
            }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      <div className="container-rtl relative z-10 section-pad">
        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* النص — يمين في RTL */}
          <div className="text-right order-1 lg:order-none">
            {/* شارة هارفارد */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-xs text-gold-300"
            >
              <span className="text-base">🎓</span>
              حاصل على شهادة CS50AI — الذكاء الاصطناعي بلغة بايثون — من جامعة هارفارد (2025)
            </motion.div>

            {/* الاسم */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl"
            >
              <span className="text-gold-gradient">
                أ.د. عماد محمد
              </span>
              <br />
              <span className="text-gold-gradient">فرحان الديلمي</span>
            </motion.h1>

            {/* التخصص */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-3 text-xl font-medium text-teal-400 sm:text-2xl"
            >
              باحث في الذكاء الاصطناعي ولغة بايثون
            </motion.p>

            {/* الرتبة الأكاديمية */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mb-2 text-base text-silver-200"
            >
              أستاذ (بروفيسور) في مقارنة الأديان والمذاهب الكلامية
            </motion.p>

            {/* الموقع */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-6 text-sm text-silver-400"
            >
              الفلوجة — العراق
            </motion.p>

            {/* الأدوار */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mb-8 flex flex-wrap justify-end gap-2"
            >
              {roles.map((r, i) => (
                <motion.span
                  key={r}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className="rounded-full border border-gold-500/25 bg-gold-500/10 px-3 py-1 text-xs text-gold-300"
                >
                  {r}
                </motion.span>
              ))}
            </motion.div>

            {/* أزرار CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap justify-end gap-3"
            >
              {ctaButtons.map((btn) => (
                <Link
                  key={btn.label}
                  href={btn.href}
                  className={
                    btn.primary
                      ? "rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-bold text-navy-950 shadow-gold transition-all hover:scale-105 hover:shadow-gold"
                      : "rounded-xl border border-gold-500/35 bg-gold-500/8 px-5 py-2.5 text-sm text-gold-300 transition-all hover:border-gold-400/60 hover:bg-gold-500/15"
                  }
                >
                  {btn.label}
                </Link>
              ))}
            </motion.div>
          </div>

          {/* الصورة */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center order-none lg:order-1"
          >
            <div className="relative">
              {/* توهج خلف الصورة */}
              <div className="absolute inset-0 rounded-3xl bg-gold-500/20 blur-3xl scale-110" />
              {/* حلقة دوارة خفية */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-3 rounded-3xl border border-dashed border-gold-500/15"
              />
              {/* الإطار الذهبي */}
              <div className="relative rounded-3xl border-2 border-gold-500/40 p-1 shadow-gold">
                <div className="h-72 w-56 overflow-hidden rounded-2xl bg-navy-800 sm:h-80 sm:w-64 lg:h-96 lg:w-72">
                  {/* placeholder للصورة — يُستبدل بـ <Image> */}
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-navy-700 to-navy-900">
                    <div className="text-center">
                      <div className="mx-auto mb-3 h-24 w-24 rounded-full bg-gold-500/20 flex items-center justify-center text-4xl">
                        👤
                      </div>
                      <p className="text-xs text-silver-400">أضف صورتك هنا</p>
                      <p className="text-xs text-silver-400 mt-1">استبدل هذا بـ &lt;Image&gt;</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* شارة CS50AI طافية */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 rounded-xl border border-gold-500/30 bg-navy-800/90 px-3 py-2 backdrop-blur-sm shadow-glass"
              >
                <p className="text-xs font-bold text-gold-400">CS50AI</p>
                <p className="text-[10px] text-silver-400">Harvard 2025</p>
              </motion.div>
              {/* شارة الفلوجة طافية */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -top-4 -right-4 rounded-xl border border-teal-400/30 bg-navy-800/90 px-3 py-2 backdrop-blur-sm shadow-glass"
              >
                <p className="text-xs font-bold text-teal-400">🇮🇶 العراق</p>
                <p className="text-[10px] text-silver-400">الفلوجة</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
