import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Tags, 
  Save, 
  X 
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

export default function Categories({ categories, userRole }: { categories: any[]; userRole: string | null }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const isAdmin = userRole === 'admin';

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Only admins can manage categories');
      return;
    }

    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'categories', editingId), { name });
        toast.success('Category updated');
      } else {
        await addDoc(collection(db, 'categories'), { name });
        toast.success('Category added');
      }
      
      setIsAdding(false);
      setEditingId(null);
      setName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'categories');
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      toast.error('Only admins can delete categories');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Category deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'categories');
      toast.error('Failed to delete category');
    }
  };

  const startEdit = (cat: any) => {
    if (!isAdmin) return;
    setEditingId(cat.id);
    setName(cat.name);
    setIsAdding(true);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Categories</h1>
          <p className="text-zinc-500 font-medium">Organize your products into logical groups.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-4 bg-black text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-black/20 hover:bg-zinc-800 transition-all"
          >
            <Plus size={18} /> Add Category
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm group hover:border-black transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-zinc-50 text-zinc-400 rounded-2xl group-hover:bg-black group-hover:text-white transition-all">
                <Tags size={24} />
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => startEdit(cat)} className="p-2 text-zinc-400 hover:text-black transition-colors">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
            <h3 className="text-xl font-black tracking-tight">{cat.name}</h3>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full py-20 text-center text-zinc-400">
            <Tags size={64} className="mx-auto mb-6 opacity-20" />
            <p className="font-black text-xl">No categories found</p>
            <p className="text-sm font-medium">Create categories to better organize your inventory.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && isAdmin && (
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
                <h3 className="text-3xl font-black tracking-tighter uppercase">{editingId ? 'Edit Category' : 'New Category'}</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 text-zinc-400 hover:text-black transition-colors">
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Category Name *</label>
                  <input 
                    className="w-full h-14 bg-zinc-100 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Beverages"
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
