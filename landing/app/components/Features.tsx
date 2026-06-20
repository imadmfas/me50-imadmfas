"use client";

import { motion } from "framer-motion";
import { FadeIn } from "./FadeIn";

const features = [
  {
    icon: "👁",
    title: "Emotion-aware vision",
    description:
      "Apple Vision framework analyses facial landmarks in real time — brow tension, eye contact, micro-expressions — and translates them into gentle, probabilistic observations. Never a diagnosis, always a possibility.",
    accent: "#7c5cfc",
    tags: ["Face landmarks", "On-device CoreML", "Real-time"],
  },
  {
    icon: "🎙",
    title: "Vocal pattern analysis",
    description:
      "AVAudioEngine listens for pace, tone, and pitch patterns that often accompany stress, fatigue, or calm. Paired with video, it gives you a richer picture of the emotional landscape.",
    accent: "#5c8afc",
    tags: ["AVAudioEngine", "Pitch & pace", "Privacy-first"],
  },
  {
    icon: "🕶",
    title: "Meta glasses integration",
    description:
      "Wear your Ray-Ban Meta glasses naturally. InsightGlass pairs via Bluetooth, routing audio through the glasses mic and speaking observations quietly through the glasses speakers — all without touching your phone.",
    accent: "#3dd9c5",
    tags: ["Meta Ray-Ban", "Bluetooth", "Hands-free"],
  },
];

export function Features() {
  return (
    <section id="features" className="section-pad">
      <div className="container-narrow">
        <FadeIn className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand-violet">
            Features
          </p>
          <h2 className="text-balance text-4xl font-bold sm:text-5xl">
            Built for{" "}
            <span className="text-gradient">thoughtful conversations</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-text-secondary">
            Every signal is on-device. Nothing is sent to a server. Your
            interactions stay private, always.
          </p>
        </FadeIn>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.1} direction="up">
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="glass-card h-full p-8"
                style={{ "--accent": f.accent } as React.CSSProperties}
              >
                {/* Icon */}
                <div
                  className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: `${f.accent}22`, border: `1px solid ${f.accent}44` }}
                >
                  {f.icon}
                </div>

                <h3 className="mb-3 text-xl font-semibold text-text-primary">
                  {f.title}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-text-secondary">
                  {f.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {f.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: `${f.accent}18`,
                        color: f.accent,
                        border: `1px solid ${f.accent}33`,
                      }}
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
