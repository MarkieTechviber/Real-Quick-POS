import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Save, 
  X, 
  Phone, 
  History 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { toast } from 'sonner';
import { db, handleFirestoreError, OperationType } from '../../firebase';

export default function Customers({ customers }: { customers: any[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: ''
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'customers', editingId), formData);
        toast.success('Customer updated');
      } else {
        await addDoc(collection(db, 'customers'), formData);
        toast.success('Customer added');
      }
      
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', contact: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'customers');
      toast.error('Failed to save customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      toast.success('Customer deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'customers');
      toast.error('Failed to delete customer');
    }
  };

  const startEdit = (customer: any) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      contact: customer.contact || ''
    });
    setIsAdding(true);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Customers</h1>
          <p className="text-zinc-500 font-medium">Manage your customer relationships and purchase history.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-4 bg-black text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-black/20 hover:bg-zinc-800 transition-all"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm group hover:border-black transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-zinc-50 text-zinc-400 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                <Users size={28} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => startEdit(customer)} className="p-2 text-zinc-400 hover:text-black transition-colors">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => handleDelete(customer.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">{customer.name}</h3>
            <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold">
              <Phone size={14} />
              <span>{customer.contact || 'No contact info'}</span>
            </div>
            <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between">
              <button className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors flex items-center gap-2">
                <History size={14} />
                View History
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">ID: {customer.id.slice(-6)}</span>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <div className="col-span-full py-20 text-center text-zinc-400">
            <Users size={64} className="mx-auto mb-6 opacity-20" />
            <p className="font-black text-xl">No customers found</p>
            <p className="text-sm font-medium">Start adding customers to track their purchases and debts.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black tracking-tighter uppercase">{editingId ? 'Edit Customer' : 'New Customer'}</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 text-zinc-400 hover:text-black transition-colors">
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Full Name *</label>
                  <input 
                    className="w-full h-14 bg-zinc-100 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Juan Dela Cruz"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Contact Number</label>
                  <input 
                    className="w-full h-14 bg-zinc-100 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                    value={formData.contact} 
                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="e.g. 0912 345 6789"
                  />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-black/20 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
