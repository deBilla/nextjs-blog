import React, { useCallback } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import ServicesSection from "../components/ServicesSection";
import LiveAppsSection from "../components/LiveAppsSection";
import ProjectsSection from "../components/ProjectsSection";
import GitHubSection from "../components/GitHubSection";
import BlogSection from "../components/BlogSection";
import ExperienceSection from "../components/ExperienceSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import data from "../data/portfolio.json";

export default function Home() {
  const handleNavigate = useCallback((section: string) => {
    const el = document.getElementById(section);
    if (el) {
      const offset = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, []);

  return (
    <>
      <Head>
        <title>{data.name} — {data.resume.tagline}</title>
        <meta
          name="description"
          content="Senior Platform Engineer building scalable distributed systems and AI infrastructure."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Ambient background */}
      <div className="bg-glow" />
      <div className="bg-glow-2" />

      <div className="relative z-10">
        <Navbar onNavigate={handleNavigate} />
        <main>
          <HeroSection />
          <AboutSection />
          <ServicesSection />
          <LiveAppsSection />
          <ProjectsSection />
          <GitHubSection />
          <BlogSection />
          <ExperienceSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
