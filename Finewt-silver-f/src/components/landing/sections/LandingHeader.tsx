import React from 'react';
import {ArrowRight, Lock, Menu, X} from 'lucide-react';
import logoImg from '@/assets/logo/landingpageLogo.png';

interface LandingHeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  scrollToSection: (id: string) => void;
  handleGoToLogin: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  scrollToSection,
  handleGoToLogin,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-[#d3c4af]/40 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        {/* Logo Branding */}
        <div
          className="flex cursor-pointer items-center"
          onClick={() => scrollToSection('hero')}
        >
          <img
            src={logoImg}
            alt="FineWt Logo"
            className="h-8 w-auto max-w-[160px] object-contain sm:h-10 sm:max-w-[220px] md:h-11"
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-7 text-xs font-semibold text-[#4f4535] sm:text-sm lg:flex">
          <button
            onClick={() => scrollToSection('features')}
            className="transition-colors hover:text-[#785600]"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('manufacturing')}
            className="transition-colors hover:text-[#785600]"
          >
            7-Stage Process
          </button>
          <button
            onClick={() => scrollToSection('modules')}
            className="transition-colors hover:text-[#785600]"
          >
            ERP Modules
          </button>
          <button
            onClick={() => scrollToSection('demo')}
            className="transition-colors hover:text-[#785600]"
          >
            System Preview
          </button>
          <button
            onClick={() => scrollToSection('trial')}
            className="transition-colors hover:text-[#785600]"
          >
            Demo Trial
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="transition-colors hover:text-[#785600]"
          >
            FAQ
          </button>
        </nav>

        {/* Action Button (Desktop) & Mobile Hamburger */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoToLogin}
            className="hidden items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#785600]/20 transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] sm:inline-flex sm:px-5 sm:py-2.5"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Login</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg border border-[#d3c4af]/60 p-2 text-[#785600] hover:bg-[#fff9ed] focus:outline-none lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="animate-in slide-in-from-top-2 space-y-3 border-t border-[#d3c4af]/40 bg-white px-4 pb-6 pt-3 shadow-xl duration-200 lg:hidden">
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-semibold text-[#4f4535]">
            <button
              onClick={() => scrollToSection('features')}
              className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('manufacturing')}
              className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
            >
              7-Stage Process
            </button>
            <button
              onClick={() => scrollToSection('modules')}
              className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
            >
              ERP Modules
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
            >
              System Preview
            </button>
            <button
              onClick={() => scrollToSection('trial')}
              className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
            >
              Demo Trial
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
            >
              FAQ
            </button>
          </div>

          <div className="border-t border-[#d3c4af]/30 pt-2">
            <button
              onClick={handleGoToLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] py-3 text-xs font-bold text-white shadow-md"
            >
              <Lock className="h-4 w-4" />
              <span>Login to ERP Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
