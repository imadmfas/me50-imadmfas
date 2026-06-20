"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FadeIn } from "./FadeIn";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for exploring InsightGlass with no commitment.",
    features: [
      "10 sessions per month",
      "Basic emotion observations",
      "iPhone camera only",
      "7-day history",
      "Demo mode",
    ],
    cta: "Download free",
    href: "#",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/ month",
    description: "Unlimited sessions, Meta glasses support, and full history.",
    features: [
      "Unlimited sessions",
      "Meta Ray-Ban glasses support",
      "Advanced vocal pattern analysis",
      "Full history & timeline",
      "Location context",
      "Priority support",
    ],
    cta: "Get early access",
    href: "#",
    highlight: true,
    badge: "Most popular",
  },
  {
    name: "Team",
    price: "$29",
    period: "/ month",
    description: "For coaches, therapists, and teams who need shared insights.",
    features: [
      "Everything in Pro",
      "Up to 5 team members",
      "Shared session notes",
      "Usage analytics",
      "Dedicated onboarding",
      "Custom ethical guidelines",
    ],
    cta: "Contact us",
    href: "mailto:hello@insightglass.app",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="section-pad bg-bg-surface/40">
      <div className="container-narrow">
        <FadeIn className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand-violet">
            Pricing
          </p>
          <h2 className="text-balance text-4xl font-bold sm:text-5xl">
            Simple, transparent{" "}
            <span className="text-gradient">pricing</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-text-secondary">
            Start free. Upgrade when you&apos;re ready. Cancel anytime.
          </p>
        </FadeIn>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <FadeIn key={p.name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`relative flex h-full flex-col rounded-xl3 p-8 ${
                  p.highlight
                    ? "bg-gradient-to-br from-brand-violet/20 to-brand-blue/10 border border-brand-violet/40 shadow-glow"
                    : "glass-card"
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-4 py-1 text-xs font-semibold text-white shadow-glow">
                    {p.badge}
                  </span>
                )}

                <div className="mb-6">
                  <p className="mb-1 text-sm font-medium text-text-muted">{p.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-text-primary">{p.price}</span>
                    <span className="text-sm text-text-muted">{p.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{p.description}</p>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-text-secondary">
                      <span className="mt-0.5 text-brand-teal">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.href}
                  className={`block rounded-full py-3 text-center text-sm font-semibold transition-all ${
                    p.highlight
                      ? "bg-gradient-brand text-white shadow-glow hover:opacity-90 hover:scale-[1.02]"
                      : "border border-border-glass text-text-secondary hover:border-brand-violet/50 hover:text-text-primary"
                  }`}
                >
                  {p.cta}
                </Link>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
