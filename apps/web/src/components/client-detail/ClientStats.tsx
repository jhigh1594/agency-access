'use client';

/**
 * ClientStats Component
 *
 * Displays client statistics in a grid of 4 cards:
 * - Total Requests
 * - Active Connections
 * - Pending
 * - Expired
 */

import { FileText, Link, Clock, AlertCircle } from 'lucide-react';
import type { ClientStats } from '@agency-platform/shared';

interface ClientStatsProps {
  stats: ClientStats;
}

export function ClientStats({ stats }: ClientStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Requests */}
      <div className="bg-card rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
            Total Requests
          </span>
          <div className="p-2.5 rounded-lg bg-indigo-50">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <p className="text-3xl font-semibold text-slate-900">{stats.totalRequests}</p>
      </div>

      {/* Active Connections */}
      <div className="bg-card rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
            Active Connections
          </span>
          <div className="p-2.5 rounded-lg bg-green-50">
            <Link className="h-5 w-5 text-green-600" />
          </div>
        </div>
        <p className="text-3xl font-semibold text-slate-900">{stats.activeConnections}</p>
      </div>

      {/* Pending */}
      <div className="bg-card rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
            Pending
          </span>
          <div className="p-2.5 rounded-lg bg-yellow-50">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
        </div>
        <p className="text-3xl font-semibold text-slate-900">{stats.pendingConnections}</p>
      </div>

      {/* Expired */}
      <div className="bg-card rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
            Expired
          </span>
          <div className="p-2.5 rounded-lg bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
        </div>
        <p className="text-3xl font-semibold text-slate-900">{stats.expiredConnections}</p>
      </div>
    </div>
  );
}
