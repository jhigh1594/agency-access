/**
 * Kit Manual Invitation Flow
 *
 * A step-by-step guide for clients to grant Kit account access
 * through team invitation (manual flow, no OAuth).
 *
 * Flow:
 * Step 1: Connect Kit (this page) - Client follows instructions to invite agency
 * Step 2: Connected - Confirmation screen
 *
 * This is the Leadsie-style manual invitation pattern, adapted for Kit.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { KitManualFlow } from '@/components/client-auth/kit/KitManualFlow';

interface ClientData {
  agencyName: string;
  agencyEmail: string;
  clientEmail?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

export default function KitManualPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch client data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}`);
        const result = await res.json();

        if (result.error || !result.data) {
          setError(result.error?.message || 'Failed to load data');
          return;
        }

        // Extract agency email from the response
        // The API response should have agency info
        setData({
          agencyName: result.data.agencyName || 'AuthHub',
          agencyEmail: result.data.agencyEmail || 'jon.highmu@gmail.com',
          clientEmail: result.data.clientEmail,
          branding: result.data.branding,
        });
      } catch (err) {
        console.error('Failed to fetch client data:', err);
        setError('Failed to load authorization data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Unable to Load</h1>
            <p className="text-slate-600 mb-6">{error || 'Invalid or expired authorization link'}</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to AuthHub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle completion of manual flow
  const handleComplete = (connectionId: string) => {
    // Redirect to step 2 (Connected confirmation)
    router.push(`/invite/${token}?step=2&platform=kit&connectionId=${connectionId}`);
  };

  // Handle back button
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              {data.branding?.logoUrl ? (
                <img src={data.branding.logoUrl} alt="AuthHub" className="h-8 w-auto" />
              ) : (
                <span className="text-xl font-bold text-slate-900">AuthHub</span>
              )}
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-6">
              <Link href={"/dashboard" as any} className="text-sm text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href={"/settings" as any} className="text-sm text-slate-600 hover:text-slate-900">
                Settings
              </Link>
              <Link href={"/logout" as any} className="text-sm text-slate-600 hover:text-slate-900">
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>

        {/* Status Line */}
        <div className="text-center mb-6">
          <p className="text-slate-600">
            Almost there! Invite <strong className="text-slate-900">{data.agencyEmail}</strong> to your Kit account
          </p>
        </div>

        {/* Manual Flow Component */}
        <KitManualFlow
          token={token}
          agencyEmail={data.agencyEmail}
          agencyName={data.agencyName}
          clientEmail={data.clientEmail}
          branding={data.branding}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link href={"/privacy" as any} className="hover:text-slate-900">
                Privacy Policy
              </Link>
              <Link href={"/terms" as any} className="hover:text-slate-900">
                Terms & Conditions
              </Link>
              <Link href={"/cookies" as any} className="hover:text-slate-900">
                Manage Cookies
              </Link>
            </div>
            <p className="text-sm text-slate-500">English</p>
            <p className="text-sm text-slate-500">© AuthHub 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
