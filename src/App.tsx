import React, { useState, useEffect, useMemo } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { Toaster, toast } from 'sonner';

import { auth, db, handleFirestoreError, OperationType } from './firebase';
import Layout from './frontend/components/Layout';

// --- Pages ---
import Dashboard from './frontend/pages/Dashboard';
import POS from './frontend/pages/POS';
import Inventory from './frontend/pages/Inventory';
import Categories from './frontend/pages/Categories';
import Customers from './frontend/pages/Customers';
import Debts from './frontend/pages/Debts';
import History from './frontend/pages/History';
import Notifications from './frontend/pages/Notifications';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user document exists and get role
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Default to cashier for new users unless it's the admin email
          const role = user.email === "markjoshuabaluran@gmail.com" ? 'admin' : 'cashier';
          await setDoc(userRef, {
            name: user.displayName,
            email: user.email,
            role: role,
            created_at: serverTimestamp()
          });
          setUserRole(role);
        } else {
          setUserRole(userSnap.data().role);
        }
      } else {
        setUserRole(null);
      }
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    // ... (rest of the listeners remain the same)

    // Real-time listeners
    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('created_at', 'desc')), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    const unsubSales = onSnapshot(query(collection(db, 'transactions'), orderBy('created_at', 'desc')), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers'));

    const unsubDebts = onSnapshot(collection(db, 'debts'), (snapshot) => {
      setDebts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'debts'));

    const unsubNotifications = onSnapshot(query(collection(db, 'notifications'), orderBy('created_at', 'desc')), (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSales();
      unsubCustomers();
      unsubDebts();
      unsubNotifications();
    };
  }, [user]);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      toast.error('Login failed');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-12 rounded-3xl shadow-xl border border-zinc-200 text-center"
        >
          <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg rotate-3">
            <ShoppingCart size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">REAL QUICK POS</h1>
          <p className="text-zinc-500 mb-12">Professional Point of Sale for your business.</p>
          <button 
            onClick={login} 
            className="w-full py-4 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
          <p className="mt-8 text-xs text-zinc-400">Secure authentication powered by Firebase</p>
        </motion.div>
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <Router>
      <Layout userRole={userRole}>
        <Routes>
          <Route path="/" element={<Dashboard products={products} sales={sales} debts={debts} customers={customers} userRole={userRole} />} />
          <Route path="/pos" element={<POS products={products} categories={categories} customers={customers} user={user} />} />
          <Route path="/inventory" element={<Inventory products={products} categories={categories} userRole={userRole} />} />
          <Route path="/categories" element={<Categories categories={categories} userRole={userRole} />} />
          <Route path="/customers" element={<Customers customers={customers} />} />
          <Route path="/debts" element={<Debts debts={debts} customers={customers} />} />
          <Route path="/history" element={<History sales={sales} userRole={userRole} />} />
          <Route path="/notifications" element={<Notifications notifications={notifications} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster position="top-center" richColors />
    </Router>
  );
}
