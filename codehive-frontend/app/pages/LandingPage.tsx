import { ThemeProvider } from "../context/ThemeContext";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { HowItWorks } from "../components/HowItWorks";
import { Testimonials } from "../components/Testimonials";
import { Pricing } from "../components/Pricing";
import { Footer } from "../components/Footer";

export function LandingPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-dark-bg">
        <Header />
        <main>
          <Hero />
          <Features />
          <HowItWorks />
          <Testimonials />
          <Pricing />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
