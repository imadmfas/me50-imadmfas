"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const bg = useTransform(
    scrollY,
    [0, 80],
    ["rgba(10,10,15,0)", "rgba(10,10,15,0.85)"]
  );
  const border = useTransform(
    scrollY,
    [0, 80],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"]
  );

  return (
    <motion.header
      style={{ backgroundColor: bg, borderBottomColor: border }}
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-colors"
    >
      <nav className="container-narrow flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-text-primary">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand text-xs text-white">
            IG
          </span>
          <span>InsightGlass</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="#pricing"
            className="rounded-full bg-gradient-brand px-5 py-2 text-sm font-medium text-white shadow-glow transition-opacity hover:opacity-90"
          >
            Get early access
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-5 bg-text-primary transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-5 bg-text-primary transition-opacity ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-5 bg-text-primary transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden md:hidden"
      >
        <ul className="flex flex-col gap-4 px-6 pb-6 pt-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="#pricing"
              onClick={() => setOpen(false)}
              className="block rounded-full bg-gradient-brand px-5 py-2.5 text-center text-sm font-medium text-white"
            >
              Get early access
            </Link>
          </li>
        </ul>
      </motion.div>
    </motion.header>
  );
}
