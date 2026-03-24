import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight, 
  CreditCard, 
  Banknote, 
  UserPlus, 
  CheckCircle2, 
  X, 
  ArrowLeft, 
  Package, 
  ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  writeBatch 
} from 'firebase/firestore';
import { toast } from 'sonner';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function POS({ products, categories, customers, user }: { products: any[]; categories: any[]; customers: any[]; user: any }) {
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      toast.error('Product out of stock');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Cannot add more than available stock');
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.stock) {
          toast.error('Cannot exceed available stock');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async (method: 'cash' | 'card' | 'debt') => {
    if (cart.length === 0) return;
    if (method === 'debt' && !selectedCustomer) {
      toast.error('Please select a customer for debt payment');
      return;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      const totalAmount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const totalCost = cart.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0);
      const profit = totalAmount - totalCost;

      // 1. Create Transaction record
      const transactionRef = doc(collection(db, 'transactions'));
      batch.set(transactionRef, {
        user_id: user.uid,
        customer_id: selectedCustomer || null,
        total_amount: totalAmount,
        total_cost: totalCost,
        profit: profit,
        payment_type: method,
        created_at: serverTimestamp()
      });

      // 2. Create Transaction Items
      for (const item of cart) {
        const itemRef = doc(collection(db, `transactions/${transactionRef.id}/items`));
        batch.set(itemRef, {
          transaction_id: transactionRef.id,
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost || 0
        });

        // 3. Update Stocks
        const productRef = doc(db, 'products', item.id);
        batch.update(productRef, {
          stock: item.stock - item.quantity
        });
      }

      // 4. Handle Debt if applicable
      if (method === 'debt' && selectedCustomer) {
        const debtRef = doc(collection(db, 'debts'));
        batch.set(debtRef, {
          customer_id: selectedCustomer,
          transaction_id: transactionRef.id,
          total_debt: totalAmount,
          remaining_balance: totalAmount,
          status: 'unpaid',
          created_at: serverTimestamp()
        });
      }

      await batch.commit();
      setIsSuccess(true);
      setTimeout(() => {
        setCart([]);
        setPaymentModal(false);
        setIsSuccess(false);
        setSelectedCustomer(null);
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
      toast.error('Failed to complete transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Products Side */}
      <div className="flex-1 flex flex-col bg-zinc-50 border-r border-zinc-200">
        <div className="p-6 bg-white border-b border-zinc-200 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              placeholder="Search products by name or category..." 
              className="w-full h-14 bg-zinc-100 border-none rounded-2xl pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all",
                !selectedCategory ? "bg-black text-white shadow-lg" : "bg-white text-zinc-400 border border-zinc-200 hover:bg-zinc-50"
              )}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all",
                  selectedCategory === cat.id ? "bg-black text-white shadow-lg" : "bg-white text-zinc-400 border border-zinc-200 hover:bg-zinc-50"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <motion.button
                key={product.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={cn(
                  "flex flex-col text-left bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm transition-all hover:border-black hover:shadow-xl disabled:opacity-50 disabled:hover:border-zinc-200 disabled:hover:shadow-sm",
                  product.stock <= 0 && "cursor-not-allowed"
                )}
              >
                <div className="flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {categories.find(c => c.id === product.category_id)?.name || 'General'}
                  </span>
                  <h4 className="font-black text-zinc-900 leading-tight mt-1 text-lg">{product.name}</h4>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <p className="text-2xl font-black text-zinc-900">${product.price.toFixed(2)}</p>
                  <div className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    product.stock < 10 ? "bg-red-50 text-red-500" : "bg-zinc-50 text-zinc-400"
                  )}>
                    {product.stock} LEFT
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <Package size={64} strokeWidth={1} className="opacity-20" />
              <p className="mt-6 font-black text-xl">No products found</p>
              <p className="text-sm font-medium">Try adjusting your search or category filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Side */}
      <div className="w-[400px] flex flex-col bg-white shadow-2xl z-10">
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <ShoppingCart size={24} /> Cart
          </h2>
          <span className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-black">{cart.length} ITEMS</span>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <AnimatePresence initial={false}>
            {cart.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 group"
              >
                <div className="flex-1">
                  <p className="font-black text-zinc-900 leading-tight">{item.name}</p>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">${item.price.toFixed(2)} / unit</p>
                </div>
                <div className="flex items-center bg-zinc-100 rounded-xl p-1.5">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors text-zinc-400 hover:text-black"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors text-zinc-400 hover:text-black"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="font-black text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-zinc-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-300">
              <ShoppingCart size={64} strokeWidth={1} className="opacity-20" />
              <p className="mt-4 font-black">Your cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-zinc-50 border-t border-zinc-200 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-sm font-bold uppercase tracking-widest">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400 text-sm font-bold uppercase tracking-widest">
              <span>Tax (0%)</span>
              <span>$0.00</span>
            </div>
            <div className="flex items-center justify-between text-3xl font-black pt-4 border-t border-zinc-200 mt-4">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={() => setPaymentModal(true)}
            className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl shadow-xl shadow-black/20 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:hover:bg-black disabled:shadow-none"
          >
            CHECKOUT
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setPaymentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              {isSuccess ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={64} />
                  </div>
                  <h3 className="text-3xl font-black mb-2">Success!</h3>
                  <p className="text-zinc-500 font-medium">Transaction completed successfully.</p>
                </div>
              ) : (
                <div className="p-10">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-3xl font-black tracking-tighter">PAYMENT</h3>
                    <button onClick={() => setPaymentModal(false)} className="p-2 text-zinc-400 hover:text-black transition-colors">
                      <X size={28} />
                    </button>
                  </div>
                  
                  <div className="space-y-4 mb-10">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Select Payment Method</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleCheckout('cash')}
                        className="flex flex-col items-center gap-4 p-8 border-2 border-zinc-100 rounded-3xl hover:border-black transition-all group"
                      >
                        <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:bg-green-100 transition-colors">
                          <Banknote size={32} />
                        </div>
                        <span className="font-black text-sm uppercase tracking-widest">Cash</span>
                      </button>
                      <button
                        onClick={() => handleCheckout('card')}
                        className="flex flex-col items-center gap-4 p-8 border-2 border-zinc-100 rounded-3xl hover:border-black transition-all group"
                      >
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-100 transition-colors">
                          <CreditCard size={32} />
                        </div>
                        <span className="font-black text-sm uppercase tracking-widest">Card</span>
                      </button>
                    </div>

                    <div className="pt-4">
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Or Mark as Debt (Utang)</p>
                      <div className="relative">
                        <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                        <select 
                          className="w-full h-14 bg-zinc-100 border-none rounded-2xl pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-black appearance-none"
                          value={selectedCustomer || ''}
                          onChange={(e) => setSelectedCustomer(e.target.value)}
                        >
                          <option value="">Select Customer...</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        disabled={!selectedCustomer || isProcessing}
                        onClick={() => handleCheckout('debt')}
                        className="w-full mt-4 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-black transition-all disabled:opacity-50"
                      >
                        CONFIRM DEBT
                      </button>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-zinc-100">
                    <div className="flex items-center justify-between text-3xl font-black">
                      <span className="text-zinc-400 tracking-tighter">TOTAL DUE</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-50">
                  <div className="w-16 h-16 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
                  <p className="mt-6 font-black text-lg">Processing Transaction...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
