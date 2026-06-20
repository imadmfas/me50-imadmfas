"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FadeIn } from "./FadeIn";

const faqs = [
  {
    q: "Is InsightGlass a medical tool?",
    a: "No. InsightGlass is explicitly not a medical or psychiatric tool. Every observation is framed as speculative — 'may appear', 'there may be signs of'. It is designed for personal communication awareness only.",
  },
  {
    q: "Does it record or upload audio or video?",
    a: "Never. All processing is entirely on-device using Apple's Vision and AVFoundation frameworks. No audio, video, or observation data is sent to any server. You can verify this with a network monitor.",
  },
  {
    q: "Does the other person know they're being analysed?",
    a: "The app is designed for consensual, supportive use only. We strongly encourage transparency with the people you're speaking with. Meta Ray-Ban glasses have a hardware recording LED that cannot be disabled — this is intentional.",
  },
  {
    q: "Which Meta glasses are supported?",
    a: "InsightGlass works with Ray-Ban Meta smart glasses via Bluetooth. Full audio routing (mic input + speaker output) is supported. Direct camera streaming from the glasses is not yet available via the Meta SDK; the app falls back to the iPhone front camera.",
  },
  {
    q: "How do I delete my data?",
    a: "Open the Privacy tab in the app and tap 'Delete all data'. This permanently wipes all sessions and observations from SwiftData. There is no cloud copy to delete.",
  },
  {
    q: "Can I use it without Meta glasses?",
    a: "Yes. Without glasses, InsightGlass uses the iPhone front camera and plays observations through your phone speaker or AirPods. The experience is fully functional — glasses just make it more seamless.",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border-glass">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
      >
        <span className="font-medium text-text-primary">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="mt-0.5 shrink-0 text-brand-violet text-xl leading-none"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-text-secondary">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="section-pad">
      <div className="container-narrow max-w-2xl">
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand-blue">
            FAQ
          </p>
          <h2 className="text-balance text-4xl font-bold sm:text-5xl">
            Questions &{" "}
            <span className="text-gradient">answers</span>
          </h2>
        </FadeIn>

        <FadeIn>
          <div className="glass-card px-8 py-2">
            {faqs.map((f) => (
              <Item key={f.q} {...f} />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
