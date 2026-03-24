import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Package, 
  Save, 
  X, 
  ChevronRight, 
  AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'sonner';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Inventory({ products, categories, userRole }: { products: any[]; categories: any[]; userRole: string | null }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    price: '',
    category_id: '',
    stock: ''
  });

  const isAdmin = userRole === 'admin';

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!formData.name || !formData.cost || !formData.price || !formData.stock || !formData.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const data = {
        name: formData.name,
        cost: parseFloat(formData.cost),
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        stock: parseInt(formData.stock),
        created_at: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), data);
        toast.success('Product updated');
      } else {
        await addDoc(collection(db, 'products'), data);
        toast.success('Product added');
      }
      
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', cost: '', price: '', category_id: '', stock: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
      toast.error('Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
      toast.error('Failed to delete product');
    }
  };

  const startEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      cost: product.cost?.toString() || '',
      price: product.price.toString(),
      category_id: product.category_id,
      stock: product.stock.toString()
    });
    setIsAdding(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Inventory</h1>
          <p className="text-zinc-500 font-medium">Manage your products and monitor stock levels.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-4 bg-black text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-black/20 hover:bg-zinc-800 transition-all"
          >
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input 
            placeholder="Search products by name..." 
            className="w-full h-14 bg-zinc-50 border-none rounded-2xl pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400">Product Details</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400">Category</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400">Cost</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400">Price</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400">Stock Status</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="p-4">
                    <p className="font-black text-zinc-900">{product.name}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">ID: {product.id.slice(-8)}</p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-xl bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">
                      {categories.find(c => c.id === product.category_id)?.name || 'General'}
                    </span>
                  </td>
                  <td className="p-4 font-black text-zinc-400">${product.cost?.toFixed(2) || '0.00'}</td>
                  <td className="p-4 font-black text-lg">${product.price.toFixed(2)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "font-black text-lg",
                        product.stock < 10 ? "text-red-500" : "text-zinc-900"
                      )}>
                        {product.stock}
                      </span>
                      {product.stock < 10 && (
                        <div className="p-1 bg-red-50 text-red-500 rounded-lg animate-pulse">
                          <AlertTriangle size={14} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => startEdit(product)}
                          className="p-3 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-black hover:text-white transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-zinc-400">
                    <Package size={64} className="mx-auto mb-6 opacity-20" />
                    <p className="font-black text-xl">Inventory is empty</p>
                    <p className="text-sm font-medium">Click "Add Product" to populate your inventory.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                <h3 className="text-3xl font-black tracking-tighter">{editingId ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 text-zinc-400 hover:text-black transition-colors">
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Product Name *</label>
                  <input 
                    className="w-full h-14 bg-zinc-100 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Espresso Blend"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Category *</label>
                  <select 
                    className="w-full h-14 bg-zinc-100 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-black appearance-none"
                    value={formData.category_id} 
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Select Category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Cost ($) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full h-14 bg-zinc-100 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                      value={formData.cost} 
                      onChange={e => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Price ($) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full h-14 bg-zinc-100 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                      value={formData.price} 
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Stock Qty *</label>
                  <input 
                    type="number"
                    className="w-full h-14 bg-zinc-100 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                    value={formData.stock} 
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
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
