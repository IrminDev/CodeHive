import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { HowItWorks } from "../components/HowItWorks";
import { Creators } from "../components/Testimonials";
import { Contact } from "../components/Contact";
import { Footer } from "../components/Footer";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Creators />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
