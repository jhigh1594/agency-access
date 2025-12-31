'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function MarketingNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg group-hover:rotate-6 transition-transform">
            AH
          </div>
          <span className="font-display text-2xl tracking-tight text-foreground">AuthHub</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-10">
          <Link href="#features" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Features</Link>
          <Link href="#how-it-works" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">How It Works</Link>
          <Link href="#pricing" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Pricing</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
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
