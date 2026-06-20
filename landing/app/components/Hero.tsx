"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const observations = [
  "The person may appear tired.",
  "There may be signs of stress or distraction.",
  "A calm supportive tone may help here.",
  "The person seems engaged and receptive.",
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden section-pad text-center">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-violet/20 blur-[120px]" />
        <div className="absolute left-1/3 top-2/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-teal/15 blur-[100px]" />
      </div>

      <div className="relative z-10 container-narrow">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-glass bg-bg-glass px-4 py-1.5 text-xs text-text-secondary backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-teal animate-pulse-slow" />
          Now available for iPhone — Meta Ray-Ban compatible
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
        >
          See the human{" "}
          <span className="text-gradient">behind the words.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-lg text-text-secondary sm:text-xl"
        >
          InsightGlass uses on-device AI with your Meta Ray-Ban glasses to offer
          soft, speculative observations about emotional context — helping you
          connect more thoughtfully, one conversation at a time.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="#pricing"
            className="rounded-full bg-gradient-brand px-8 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(124,92,252,0.45)]"
          >
            Get early access
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-full border border-border-glass px-8 py-3.5 text-sm font-medium text-text-secondary transition-colors hover:border-brand-violet/50 hover:text-text-primary"
          >
            See how it works
          </Link>
        </motion.div>

        {/* Floating mock observation card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-20 max-w-sm"
        >
          <div className="glass-card p-6 text-left">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-widest">
                Live observation
              </span>
              <span className="flex items-center gap-1.5 text-xs text-brand-teal">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-teal animate-pulse" />
                On-device
              </span>
            </div>
            <div className="space-y-3">
              {observations.map((obs, i) => (
                <motion.div
                  key={obs}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + i * 0.15 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-violet" />
                  <p className="text-sm text-text-secondary">{obs}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-bg-surface overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "72%" }}
                  transition={{ duration: 1.2, delay: 1.4, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-brand"
                />
              </div>
              <span className="text-xs text-text-muted">72% confidence</span>
            </div>
          </div>
        </motion.div>

        {/* Social proof number */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-10 text-sm text-text-muted"
        >
          Trusted by{" "}
          <span className="text-text-secondary font-medium">2,400+ early users</span>{" "}
          across 38 countries
        </motion.p>
      </div>
    </section>
  );
}
