import Link from 'next/link';
import type { Route } from 'next';

export function MarketingFooter() {
  return (
    <footer className="bg-card py-24 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-xs space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">AH</div>
              <span className="font-display text-xl tracking-tight">AuthHub</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">
              The easy button for agency access to client accounts.
              Replace weeks of back-and-forth with one link.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div>
              <h4 className="font-bold uppercase tracking-widest text-xs mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-primary transition-colors">How It Works</Link></li>
                <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-widest text-xs mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href={"/about" as Route} className="hover:text-primary transition-colors">About</Link></li>
                <li><Link href={"/contact" as Route} className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-widest text-xs mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href={"/privacy" as Route} className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href={"/terms" as Route} className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-24 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AuthHub. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href={"/privacy" as Route} className="hover:text-primary transition-colors">Privacy</Link>
            <Link href={"/terms" as Route} className="hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
