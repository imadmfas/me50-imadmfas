"use client";

import { motion } from "framer-motion";
import { FadeIn } from "./FadeIn";

const testimonials = [
  {
    quote:
      "InsightGlass has genuinely changed how I show up in difficult conversations. It's not about reading minds — it's about being present.",
    name: "Aiko T.",
    role: "Therapist, Tokyo",
    avatar: "AT",
  },
  {
    quote:
      "I was sceptical about AI in personal conversations, but the speculative framing is refreshing. It prompts reflection without telling me what to think.",
    name: "Marcus L.",
    role: "Executive coach, London",
    avatar: "ML",
  },
  {
    quote:
      "The privacy design is what sold me. On-device only, no cloud, delete everything with one tap. Finally an AI tool I trust.",
    name: "Priya R.",
    role: "Product designer, Bangalore",
    avatar: "PR",
  },
];

const stats = [
  { value: "2,400+", label: "Early adopters" },
  { value: "38", label: "Countries" },
  { value: "100%", label: "On-device only" },
  { value: "4.9★", label: "TestFlight rating" },
];

export function SocialProof() {
  return (
    <section className="section-pad">
      <div className="container-narrow">
        {/* Stats */}
        <FadeIn className="mb-20 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 text-center"
            >
              <p className="text-gradient text-3xl font-bold">{s.value}</p>
              <p className="mt-1 text-sm text-text-muted">{s.label}</p>
            </motion.div>
          ))}
        </FadeIn>

        {/* Heading */}
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand-teal">
            Testimonials
          </p>
          <h2 className="text-balance text-4xl font-bold sm:text-5xl">
            What early users are saying
          </h2>
        </FadeIn>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="glass-card flex h-full flex-col p-8"
              >
                {/* Stars */}
                <div className="mb-4 flex gap-0.5 text-brand-violet text-sm">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span key={j}>★</span>
                  ))}
                </div>

                <p className="flex-1 text-sm leading-relaxed text-text-secondary">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-xs font-semibold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
