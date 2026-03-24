import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Banknote, 
  CreditCard, 
  AlertCircle, 
  ChevronRight, 
  Clock,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function HistoryPage({ sales, userRole }: { sales: any[]; userRole: string | null }) {
  const [search, setSearch] = useState('');
  const isAdmin = userRole === 'admin';

  const filteredSales = sales.filter(sale => 
    sale.id.toLowerCase().includes(search.toLowerCase()) ||
    sale.payment_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Sales History</h1>
          <p className="text-zinc-500 font-medium">Review and audit all completed transactions.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input 
            placeholder="Search transactions by ID or payment type..." 
            className="w-full h-14 bg-zinc-50 border-none rounded-2xl pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400">Transaction ID</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400">Date & Time</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400">Payment Type</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400">Total Amount</th>
                {isAdmin && <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400">Profit</th>}
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="p-4">
                    <p className="font-black text-zinc-900 tracking-tighter uppercase">#{sale.id.slice(-8)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-zinc-400" />
                      <p className="font-bold text-sm">{format(sale.created_at?.toDate() || new Date(), 'MMM d, yyyy • h:mm a')}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-black uppercase tracking-widest",
                      sale.payment_type === 'cash' ? "bg-green-50 text-green-600" : 
                      sale.payment_type === 'card' ? "bg-blue-50 text-blue-600" : 
                      "bg-orange-50 text-orange-600"
                    )}>
                      {sale.payment_type === 'cash' ? <Banknote size={14} /> : 
                       sale.payment_type === 'card' ? <CreditCard size={14} /> : 
                       <AlertCircle size={14} />}
                      {sale.payment_type}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-black text-xl text-zinc-900">${sale.total_amount.toFixed(2)}</p>
                  </td>
                  {isAdmin && (
                    <td className="p-4">
                      <p className="font-black text-green-600">+${(sale.profit || 0).toFixed(2)}</p>
                    </td>
                  )}
                  <td className="p-4 text-right">
                    <button className="p-3 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-20 text-center text-zinc-400">
                    <HistoryIcon size={64} className="mx-auto mb-6 opacity-20" />
                    <p className="font-black text-xl">No transactions found</p>
                    <p className="text-sm font-medium">Complete sales in the POS terminal to see them here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
