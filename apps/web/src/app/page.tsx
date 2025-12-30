import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SignInButton, SignUpButton } from '@clerk/nextjs';

export default async function Home() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  // Landing page for unauthenticated users
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4 text-center">Agency Access Platform</h1>
        <p className="text-lg text-muted-foreground text-center mb-8">
          OAuth aggregation for marketing agencies
        </p>

        {/* Sign In / Sign Up Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-6 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </div>
    </main>
  );
}
