"use client";

import { FadeIn } from "./FadeIn";

const timeline = [
  {
    year: "2025",
    title: "شهادة CS50AI من هارفارد",
    body: "أتمّ دراسة الذكاء الاصطناعي بلغة بايثون من جامعة هارفارد — CS50's Introduction to Artificial Intelligence with Python.",
    color: "#d4a843",
  },
  {
    year: "جارٍ",
    title: "أستاذ جامعي — مقارنة الأديان والمذاهب الكلامية",
    body: "أستاذ (بروفيسور) في تخصص مقارنة الأديان والمذاهب الكلامية، الفلوجة — العراق، مع أكثر من 15 عاماً من التدريس الجامعي.",
    color: "#3dd9c5",
  },
  {
    year: "متعدد",
    title: "خبير ذكاء اصطناعي وتحول رقمي",
    body: "مدرّب دولي معتمد في الذكاء الاصطناعي، تطوير التطبيقات، والتحول الرقمي. حاضر في أكثر من 40 مؤتمراً داخل العراق و6 مؤتمرات دولية.",
    color: "#d4a843",
  },
  {
    year: "مستمر",
    title: "مؤلف · مترجم · شاعر",
    body: "صاحب 6 كتب مطبوعة، 3 كتب مترجمة، وديوانَي شعر. يجمع بين الأكاديمية والأدب والتقنية في مسيرة فكرية متجددة.",
    color: "#3dd9c5",
  },
];

export function Bio() {
  return (
    <section id="bio" className="section-pad bg-navy-900/30">
      <div className="container-rtl">
        <FadeIn className="mb-14 text-right">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gold-500">
            السيرة الذاتية
          </p>
          <h2 className="text-3xl font-black sm:text-4xl">
            <span className="text-gold-gradient">مسيرة أكاديمية</span>{" "}
            <span className="text-silver-200">متميزة</span>
          </h2>
        </FadeIn>

        <div className="relative">
          {/* خط الزمن */}
          <div className="absolute right-[5px] top-0 h-full w-px bg-gradient-to-b from-gold-500/0 via-gold-500/40 to-gold-500/0 hidden md:block" />

          <div className="space-y-10">
            {timeline.map((item, i) => (
              <FadeIn key={item.year + item.title} delay={i * 0.1} direction="right">
                <div className="flex items-start gap-6 md:pr-8">
                  {/* نقطة الزمن */}
                  <div
                    className="relative hidden md:block shrink-0 -mr-[13px]"
                    style={{ order: -1 }}
                  >
                    <div
                      className="mt-2 h-3 w-3 rounded-full"
                      style={{ background: item.color, boxShadow: `0 0 12px ${item.color}80` }}
                    />
                  </div>

                  {/* البطاقة */}
                  <div className="glass-card gold-border flex-1 rounded-2xl p-6 text-right">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span
                        className="rounded-full px-3 py-0.5 text-xs font-bold"
                        style={{
                          background: `${item.color}22`,
                          color: item.color,
                          border: `1px solid ${item.color}44`,
                        }}
                      >
                        {item.year}
                      </span>
                      <h3 className="text-base font-bold text-silver-200">{item.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-silver-400">{item.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
