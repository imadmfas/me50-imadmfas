"use client";

import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  { value: 6, label: "مؤتمرات دولية", suffix: "" },
  { value: 40, label: "مؤتمر داخل العراق", suffix: "+" },
  { value: 7, label: "تطبيقات أندرويد", suffix: "" },
  { value: 2, label: "ديوانا شعر", suffix: "" },
  { value: 3, label: "كتب مترجمة", suffix: "" },
  { value: 6, label: "كتب مطبوعة", suffix: "" },
  { value: 15, label: "سنة تدريس", suffix: "+" },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 1500, bounce: 0 });
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, motionVal, value]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="border-y border-gold-500/15 bg-navy-900/60 backdrop-blur-sm">
      <div className="container-rtl px-4 sm:px-6 lg:px-16 py-10 overflow-x-auto">
        <div className="flex gap-4 min-w-max mx-auto justify-center flex-wrap">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, scale: 1.03 }}
              className="glass-card gold-border rounded-2xl px-6 py-5 text-center min-w-[110px] cursor-default"
            >
              <p className="text-2xl font-black text-gold-400 sm:text-3xl">
                <AnimatedNumber value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-xs text-silver-400">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
