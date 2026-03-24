import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  History, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Save 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Debts({ debts, customers }: { debts: any[]; customers: any[] }) {
  const [isPaying, setIsPaying] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handlePayment = async () => {
    if (!selectedDebt || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    if (amount > selectedDebt.remaining_balance) {
      toast.error('Payment exceeds remaining balance');
      return;
    }

    try {
      const newBalance = selectedDebt.remaining_balance - amount;
      const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid';

      // 1. Update Debt record
      await updateDoc(doc(db, 'debts', selectedDebt.id), {
        remaining_balance: newBalance,
        status: newStatus
      });

      // 2. Create Payment record
      await addDoc(collection(db, 'payments'), {
        debt_id: selectedDebt.id,
        amount: amount,
        payment_date: serverTimestamp()
      });

      toast.success('Payment recorded successfully');
      setIsPaying(false);
      setSelectedDebt(null);
      setPaymentAmount('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'payments');
      toast.error('Failed to record payment');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Utang / Debts</h1>
          <p className="text-zinc-500 font-medium">Track customer balances and payments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {debts.map(debt => {
          const customer = customers.find(c => c.id === debt.customer_id);
          return (
            <div key={debt.id} className="bg-white rounded-[40px] border border-zinc-200 shadow-sm overflow-hidden group hover:border-black transition-all">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    debt.status === 'paid' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    <CreditCard size={24} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                    debt.status === 'paid' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}>
                    {debt.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-1">{customer?.name || 'Unknown Customer'}</h3>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-8">ID: {debt.id.slice(-8)}</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-zinc-400 uppercase tracking-widest">Total Debt</span>
                    <span>${debt.total_debt.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-black pt-4 border-t border-zinc-100">
                    <span className="text-zinc-400 tracking-tighter uppercase">Balance</span>
                    <span className="text-red-600">${debt.remaining_balance.toFixed(2)}</span>
                  </div>
                </div>

                {debt.status !== 'paid' && (
                  <button 
                    onClick={() => {
                      setSelectedDebt(debt);
                      setIsPaying(true);
                    }}
                    className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-black/20 hover:bg-zinc-800 transition-all"
                  >
                    RECORD PAYMENT
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {debts.length === 0 && (
          <div className="col-span-full py-20 text-center text-zinc-400">
            <CreditCard size={64} className="mx-auto mb-6 opacity-20" />
            <p className="font-black text-xl">No debt records found</p>
            <p className="text-sm font-medium">Debts are created automatically when checking out with "Debt" payment method.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPaying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaying(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black tracking-tighter uppercase">Record Payment</h3>
                <button onClick={() => setIsPaying(false)} className="p-2 text-zinc-400 hover:text-black transition-colors">
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Remaining Balance</p>
                  <p className="text-3xl font-black text-red-600">${selectedDebt?.remaining_balance.toFixed(2)}</p>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Payment Amount ($) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full h-14 bg-zinc-100 border-none rounded-2xl pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                      value={paymentAmount} 
                      onChange={e => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setIsPaying(false)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePayment}
                  className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-black/20 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
