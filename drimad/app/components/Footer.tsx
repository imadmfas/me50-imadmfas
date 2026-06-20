import Link from "next/link";

const quickLinks = [
  "الرئيسية", "السيرة الذاتية", "البحوث", "المؤلفات",
  "تحميل الكتب", "التطبيقات", "النشاطات", "تواصل معي",
];

export function Footer() {
  return (
    <footer className="border-t border-gold-500/15 bg-navy-900/80 backdrop-blur-sm">
      <div className="container-rtl px-4 sm:px-6 lg:px-16 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 text-right">
          {/* العلامة */}
          <div>
            <h3 className="mb-2 text-lg font-black text-gold-gradient">
              أ.د. عماد محمد فرحان الديلمي
            </h3>
            <p className="mb-1 text-sm text-silver-400">
              باحث في الذكاء الاصطناعي ولغة بايثون
            </p>
            <p className="text-sm text-silver-400">
              أستاذ في مقارنة الأديان والمذاهب الكلامية
            </p>
            <p className="mt-2 text-xs text-silver-400">الفلوجة — العراق</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {["📘", "▶️", "🐦", "💼"].map((icon) => (
                <Link
                  key={icon}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/25 bg-gold-500/10 text-base transition hover:border-gold-400/50 hover:bg-gold-500/20"
                >
                  {icon}
                </Link>
              ))}
            </div>
          </div>

          {/* روابط سريعة */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-silver-400">
              روابط سريعة
            </h4>
            <ul className="grid grid-cols-2 gap-2">
              {quickLinks.map((l) => (
                <li key={l}>
                  <Link
                    href={`#${l}`}
                    className="text-sm text-silver-400 transition hover:text-gold-400"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* اقتباس */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-silver-400">
              كلمة
            </h4>
            <blockquote className="border-r-2 border-gold-500/50 pr-4">
              <p className="text-sm leading-relaxed text-silver-400 italic">
                &ldquo;العلم نور يُضيء به الإنسان طريقه، والذكاء الاصطناعي أداة في يد من يحسن توجيهه نحو الخير.&rdquo;
              </p>
              <cite className="mt-2 block text-xs text-gold-500">— أ.د. عماد الديلمي</cite>
            </blockquote>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gold-500/10 pt-8 sm:flex-row text-right">
          <p className="text-xs text-silver-400">
            © {new Date().getFullYear()} جميع الحقوق محفوظة — أ.د. عماد محمد فرحان الديلمي
          </p>
          <p className="text-xs text-silver-400">
            <span className="text-gold-500">drimad.net</span> — النسخة الثانية
          </p>
        </div>
      </div>
    </footer>
  );
}
