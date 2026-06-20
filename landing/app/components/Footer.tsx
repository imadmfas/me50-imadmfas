import Link from "next/link";

const links = {
  Product: ["Features", "How it works", "Pricing", "Changelog"],
  Legal: ["Privacy policy", "Terms of use", "Ethical guidelines"],
  Connect: ["GitHub", "Twitter / X", "hello@insightglass.app"],
};

export function Footer() {
  return (
    <footer className="border-t border-border-glass bg-bg-surface/40">
      <div className="container-narrow section-pad">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand text-xs text-white font-semibold">
                IG
              </span>
              <span className="font-semibold text-text-primary">InsightGlass</span>
            </div>
            <p className="text-sm leading-relaxed text-text-muted">
              An experimental empathy assistant for iPhone and Meta Ray-Ban glasses. Built with privacy at its core.
            </p>
            <p className="mt-4 text-xs text-text-muted">
              Not a medical device. Observations are speculative.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
                {category}
              </h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border-glass pt-8 sm:flex-row">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} InsightGlass. MIT License. Use responsibly.
          </p>
          <p className="text-xs text-text-muted">
            Made with ♥ for more empathetic conversations
          </p>
        </div>
      </div>
    </footer>
  );
}
