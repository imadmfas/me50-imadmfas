import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Stats } from "./components/Stats";
import { Bio } from "./components/Bio";
import { Research } from "./components/Research";
import { Books } from "./components/Books";
import { Apps } from "./components/Apps";
import { Activities } from "./components/Activities";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Bio />
        <Research />
        <Books />
        <Apps />
        <Activities />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
