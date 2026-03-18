import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

interface NavbarProps {
  onNavigate?: (section: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = router.pathname === "/";

  const handleNav = (section: string) => {
    setMobileOpen(false);
    if (isHome && onNavigate) {
      onNavigate(section);
    } else {
      router.push(`/#${section}`);
    }
  };

  const navLinks = [
    { label: "About", section: "about" },
    { label: "Projects", section: "projects" },
    { label: "GitHub", section: "repositories" },
    { label: "Blog", section: "blog" },
    { label: "Experience", section: "experience" },
    { label: "Contact", section: "contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass bg-[#050507]/80 border-b border-gray-800/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="font-bold text-lg tracking-tight link-hover"
        >
          BillaCode<span className="text-brand-500">.</span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNav(link.section)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                text-gray-400 hover:text-white hover:bg-white/5"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/5 text-gray-400"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t glass bg-[#050507]/95 border-gray-800/50">
          <div className="px-6 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.section)}
                className="px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-all duration-200
                  text-gray-400 hover:text-white hover:bg-white/5"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
