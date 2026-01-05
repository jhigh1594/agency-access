'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-300"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
    >
      {open ? (
        <>
          <motion.path
            d="M18 6L6 18"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          />
          <motion.path
            d="M6 6l12 12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          />
        </>
      ) : (
        <>
          <path d="M3 12h18" />
          <path d="M3 6h18" />
          <path d="M3 18h18" />
        </>
      )}
    </svg>
  );
}

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    const handleRouteChange = () => setMobileMenuOpen(false);
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group" onClick={handleLinkClick}>
          <div className="w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-all duration-300 relative">
            <img 
              src="/authhub.png" 
              alt="AuthHub" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-display text-3xl tracking-tight text-foreground font-bold group-hover:text-primary transition-colors">AuthHub</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-10">
          <Link href="#features" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Features</Link>
          <Link href="#how-it-works" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">How It Works</Link>
          <Link href="#pricing" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Pricing</Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <div className="h-6 w-px bg-border" />
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="font-bold uppercase tracking-widest text-xs">Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="primary" size="md" className="font-bold uppercase tracking-widest text-xs px-6">Get Started</Button>
          </SignUpButton>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center justify-center p-2 min-h-[44px] min-w-[44px] rounded-lg hover:bg-muted/10 touch-feedback"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          <MenuIcon open={mobileMenuOpen} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              aria-hidden="true"
            />

            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-background md:hidden shadow-2xl overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="font-display text-xl font-bold">Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center p-2 min-h-[44px] min-w-[44px] rounded-lg hover:bg-muted/10 touch-feedback"
                    aria-label="Close menu"
                  >
                    <MenuIcon open={true} />
                  </button>
                </div>

                {/* Mobile Menu Content */}
                <div className="flex-1 p-6 space-y-2">
                  {/* Navigation Links */}
                  <div className="space-y-2 mb-8">
                    <Link
                      href="#features"
                      onClick={handleLinkClick}
                      className="block py-4 px-6 text-lg font-bold min-h-[56px] flex items-center rounded-xl hover:bg-muted/10 transition-colors touch-feedback"
                    >
                      Features
                    </Link>
                    <Link
                      href="#how-it-works"
                      onClick={handleLinkClick}
                      className="block py-4 px-6 text-lg font-bold min-h-[56px] flex items-center rounded-xl hover:bg-muted/10 transition-colors touch-feedback"
                    >
                      How It Works
                    </Link>
                    <Link
                      href="#pricing"
                      onClick={handleLinkClick}
                      className="block py-4 px-6 text-lg font-bold min-h-[56px] flex items-center rounded-xl hover:bg-muted/10 transition-colors touch-feedback"
                    >
                      Pricing
                    </Link>
                  </div>

                  {/* Auth Buttons */}
                  <div className="space-y-3 pt-8 border-t border-border">
                    <SignInButton mode="modal">
                      <Button
                        variant="ghost"
                        className="w-full font-bold uppercase tracking-widest text-sm py-6"
                        onClick={handleLinkClick}
                      >
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button
                        variant="primary"
                        className="w-full font-bold uppercase tracking-widest text-sm py-6 shadow-xl"
                        onClick={handleLinkClick}
                      >
                        Get Started
                      </Button>
                    </SignUpButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
