import React from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CreditCard, 
  Info, 
  CheckCircle2, 
  X, 
  Clock 
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Notifications({ notifications }: { notifications: any[] }) {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Notifications</h1>
          <p className="text-zinc-500 font-medium">Stay updated with system alerts and activities.</p>
        </div>
        <button className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map(notif => (
          <div key={notif.id} className={cn(
            "bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-start gap-6 group hover:border-black transition-all",
            notif.status === 'unread' && "border-l-4 border-l-black"
          )}>
            <div className={cn(
              "p-4 rounded-2xl shrink-0",
              notif.type === 'low_stock' ? "bg-red-50 text-red-500" : 
              notif.type === 'unpaid_debt' ? "bg-orange-50 text-orange-500" : 
              "bg-blue-50 text-blue-500"
            )}>
              {notif.type === 'low_stock' ? <AlertTriangle size={24} /> : 
               notif.type === 'unpaid_debt' ? <CreditCard size={24} /> : 
               <Info size={24} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-black text-lg tracking-tight">{notif.type.replace('_', ' ').toUpperCase()}</h3>
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1">
                  <Clock size={10} />
                  {format(notif.created_at?.toDate() || new Date(), 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="text-zinc-500 font-medium leading-relaxed">{notif.message}</p>
              <div className="mt-4 flex items-center gap-3">
                <button className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
                  VIEW DETAILS
                </button>
                <button className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors">
                  DISMISS
                </button>
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="py-20 text-center text-zinc-400">
            <Bell size={64} className="mx-auto mb-6 opacity-20" />
            <p className="font-black text-xl">All caught up!</p>
            <p className="text-sm font-medium">You have no new notifications at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
