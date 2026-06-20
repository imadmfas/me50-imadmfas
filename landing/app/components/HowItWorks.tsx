"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FadeIn } from "./FadeIn";

const steps = [
  {
    step: "01",
    title: "Pair your glasses",
    body: "Open InsightGlass and connect your Meta Ray-Ban glasses via Bluetooth in seconds. No Meta account needed for basic pairing.",
  },
  {
    step: "02",
    title: "Start a session",
    body: "Tap Live and point the camera at the person you're talking with. The app begins analysing visual and audio signals immediately — all on your device.",
  },
  {
    step: "03",
    title: "Receive soft observations",
    body: "InsightGlass whispers speculative observations through your glasses speakers: subtle hints to help you listen better, not instructions on what to think.",
  },
  {
    step: "04",
    title: "Review & reflect",
    body: "After each session, browse the observation timeline to spot patterns in your conversations and grow your emotional awareness over time.",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="section-pad bg-bg-surface/40">
      <div className="container-narrow" ref={ref}>
        <FadeIn className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand-blue">
            How it works
          </p>
          <h2 className="text-balance text-4xl font-bold sm:text-5xl">
            From glasses to{" "}
            <span className="text-gradient">genuine connection</span>
          </h2>
        </FadeIn>

        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-brand-violet/0 via-brand-violet/30 to-brand-violet/0 md:left-1/2 md:block" />

          <div className="space-y-12">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.25, 0.4, 0.25, 1] }}
                className={`flex items-start gap-8 md:items-center ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Card */}
                <div className="glass-card flex-1 p-8">
                  <span className="mb-3 block text-xs font-bold tracking-widest text-text-muted">
                    {s.step}
                  </span>
                  <h3 className="mb-2 text-xl font-semibold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{s.body}</p>
                </div>

                {/* Centre dot */}
                <div className="hidden shrink-0 md:flex">
                  <div className="h-4 w-4 rounded-full border-2 border-brand-violet bg-bg-base" />
                </div>

                {/* Spacer (mirror card) */}
                <div className="hidden flex-1 md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
