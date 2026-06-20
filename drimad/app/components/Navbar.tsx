"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "الرئيسية", href: "#hero" },
  { label: "السيرة الذاتية", href: "#bio" },
  { label: "البحوث", href: "#research" },
  { label: "المؤلفات", href: "#books" },
  { label: "تحميل الكتب", href: "#download" },
  { label: "التطبيقات", href: "#apps" },
  { label: "فيديوهاتي", href: "#videos" },
  { label: "النشاطات", href: "#activities" },
  { label: "المركز والمجلة", href: "#center" },
  { label: "المعرض", href: "#gallery" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const bg = useTransform(
    scrollY,
    [0, 60],
    ["rgba(5,13,31,0)", "rgba(5,13,31,0.95)"]
  );
  const borderOpacity = useTransform(scrollY, [0, 60], [0, 1]);

  return (
    <motion.header
      style={{ backgroundColor: bg }}
      className="fixed inset-x-0 top-0 z-50 backdrop-blur-xl"
    >
      <motion.div
        style={{ opacity: borderOpacity }}
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-gold-500/30 to-transparent"
      />

      <nav className="container-rtl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-16">
        {/* اسم الموقع */}
        <Link href="#hero" className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-gold-400">
            أ.د. عماد محمد فرحان الديلمي
          </span>
          <span className="text-xs text-silver-400">الموقع الرسمي</span>
        </Link>

        {/* روابط سطح المكتب */}
        <ul className="hidden items-center gap-5 xl:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-sm text-silver-400 transition-colors hover:text-gold-400"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* أزرار يسار */}
        <div className="flex items-center gap-2">
          <button className="hidden rounded-full border border-gold-500/40 px-3 py-1 text-xs text-gold-400 transition hover:bg-gold-500/10 sm:block">
            EN
          </button>
          <Link
            href="#contact"
            className="hidden rounded-full bg-gradient-gold px-4 py-1.5 text-xs font-bold text-navy-950 shadow-gold-sm transition hover:opacity-90 sm:block"
          >
            تواصل معي
          </Link>

          {/* همبرغر */}
          <button
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 xl:hidden"
            aria-label="القائمة"
          >
            <span className={`block h-0.5 w-5 bg-gold-400 transition-transform duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-gold-400 transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-gold-400 transition-transform duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </nav>

      {/* القائمة المحمولة */}
      <motion.div
        initial={false}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden bg-navy-900/98 backdrop-blur-xl xl:hidden"
      >
        <ul className="flex flex-col gap-1 px-6 pb-6 pt-2">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm text-silver-400 hover:text-gold-400"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="mt-3 flex gap-2">
            <button className="rounded-full border border-gold-500/40 px-4 py-2 text-xs text-gold-400">EN</button>
            <Link
              href="#contact"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full bg-gradient-gold py-2 text-center text-xs font-bold text-navy-950"
            >
              تواصل معي
            </Link>
          </li>
        </ul>
      </motion.div>
    </motion.header>
  );
}
