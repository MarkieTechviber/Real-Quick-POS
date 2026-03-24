import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  Clock,
  DollarSign,
  Calendar,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { format, isToday, isThisMonth, isThisYear } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FilterType = 'daily' | 'monthly' | 'yearly';

export default function Dashboard({ products, sales, debts, customers, userRole }: { products: any[]; sales: any[]; debts: any[]; customers: any[]; userRole: string | null }) {
  const [filter, setFilter] = useState<FilterType>('daily');
  const isAdmin = userRole === 'admin';

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const date = sale.created_at?.toDate() || new Date();
      if (filter === 'daily') return isToday(date);
      if (filter === 'monthly') return isThisMonth(date);
      if (filter === 'yearly') return isThisYear(date);
      return true;
    });
  }, [sales, filter]);

  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalProfit = filteredSales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const totalDebt = debts.reduce((sum, d) => sum + d.remaining_balance, 0);
    const lowStockCount = products.filter(p => p.stock < 10).length;

    return {
      revenue: totalRevenue,
      profit: totalProfit,
      salesCount: filteredSales.length,
      debt: totalDebt,
      customers: customers.length,
      lowStock: lowStockCount
    };
  }, [filteredSales, debts, products, customers]);

  const StatCard = ({ icon: Icon, label, value, color, trend, subValue }: any) => (
    <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group">
      <div className="flex items-start justify-between mb-6">
        <div className={cn("p-4 rounded-2xl", color)}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
            trend > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}>
            {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-4xl font-black tracking-tight text-zinc-900">{value}</h3>
        {subValue && <p className="text-zinc-400 text-[10px] font-bold mt-2 uppercase tracking-wider">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 font-medium mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl">
          {(['daily', 'monthly', 'yearly'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                filter === f ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          icon={TrendingUp} 
          label="Total Revenue" 
          value={`$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          color="bg-black"
          subValue={`${stats.salesCount} transactions`}
        />
        {isAdmin && (
          <StatCard 
            icon={DollarSign} 
            label="Net Profit" 
            value={`$${stats.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            color="bg-green-500"
            subValue="Based on cost vs price"
          />
        )}
        <StatCard 
          icon={CreditCard} 
          label="Outstanding Debt" 
          value={`$${stats.debt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          color="bg-orange-500"
          subValue="Total collectibles"
        />
        <StatCard 
          icon={Users} 
          label="Total Customers" 
          value={stats.customers}
          color="bg-blue-500"
          subValue="Registered profiles"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight">Recent Transactions</h3>
            <button className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">View All</button>
          </div>
          <div className="divide-y divide-zinc-100">
            {filteredSales.slice(0, 5).map(sale => (
              <div key={sale.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-black text-zinc-900">Transaction #{sale.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{format(sale.created_at?.toDate() || new Date(), 'h:mm a')} • {sale.payment_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl">${sale.total_amount.toFixed(2)}</p>
                  {isAdmin && <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Profit: +${(sale.profit || 0).toFixed(2)}</p>}
                </div>
              </div>
            ))}
            {filteredSales.length === 0 && (
              <div className="p-20 text-center text-zinc-300">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-black">No transactions for this period</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight">Stock Alerts</h3>
            <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest">
              {stats.lowStock} Critical
            </span>
          </div>
          <div className="p-4 space-y-4">
            {products.filter(p => p.stock < 10).slice(0, 6).map(product => (
              <div key={product.id} className="p-4 bg-zinc-50 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="font-black text-sm text-zinc-900">{product.name}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{product.stock} units left</p>
                  </div>
                </div>
                <button className="p-2 text-zinc-300 hover:text-black transition-colors">
                  <ArrowRight size={18} />
                </button>
              </div>
            ))}
            {stats.lowStock === 0 && (
              <div className="p-12 text-center text-zinc-300">
                <Package size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-black">Stock levels healthy</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
