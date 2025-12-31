'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function MarketingNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black text-xl shadow-[0_8px_16px_-4px_rgba(255,107,53,0.4)] group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
            <span className="relative z-10">AH</span>
          </div>
          <span className="font-display text-2xl tracking-tight text-foreground font-bold group-hover:text-primary transition-colors">AuthHub</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-10">
          <Link href="#features" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Features</Link>
          <Link href="#how-it-works" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">How It Works</Link>
          <Link href="#pricing" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Pricing</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="h-6 w-px bg-border hidden sm:block" />
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex font-bold uppercase tracking-widest text-xs">Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="primary" size="md" className="font-bold uppercase tracking-widest text-xs px-6">Get Started</Button>
          </SignUpButton>
        </div>
      </div>
    </nav>
  );
}
