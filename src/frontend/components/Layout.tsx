import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Users, 
  CreditCard, 
  Bell, 
  Tags, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NavLink = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean; key?: string }) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200",
      active 
        ? "bg-black text-white shadow-lg shadow-black/20" 
        : "text-zinc-500 hover:text-black hover:bg-zinc-100"
    )}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default function Layout({ children, userRole }: { children: React.ReactNode; userRole: string | null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isAdmin = userRole === 'admin';

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/pos', icon: <ShoppingCart size={20} />, label: 'POS Terminal' },
    ...(isAdmin ? [
      { to: '/inventory', icon: <Package size={20} />, label: 'Inventory' },
      { to: '/categories', icon: <Tags size={20} />, label: 'Categories' },
    ] : []),
    { to: '/customers', icon: <Users size={20} />, label: 'Customers' },
    { to: '/debts', icon: <CreditCard size={20} />, label: 'Utang / Debts' },
    ...(isAdmin ? [
      { to: '/history', icon: <History size={20} />, label: 'Sales History' },
    ] : []),
    { to: '/notifications', icon: <Bell size={20} />, label: 'Notifications' },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-zinc-200 p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-black text-white p-2 rounded-xl rotate-3 shadow-lg">
            <ShoppingCart size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tighter">REAL QUICK POS</h1>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              icon={item.icon} 
              label={item.label} 
              active={location.pathname === item.to} 
            />
          ))}
        </nav>

        <div className="pt-6 border-t border-zinc-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Mobile */}
        <header className="lg:hidden h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-lg">
              <ShoppingCart size={18} />
            </div>
            <span className="font-black tracking-tighter">REAL QUICK POS</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-zinc-500">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-72 bg-white z-50 lg:hidden p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-black tracking-tighter">MENU</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-500">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                  <NavLink 
                    key={item.to} 
                    to={item.to} 
                    icon={item.icon} 
                    label={item.label} 
                    active={location.pathname === item.to} 
                  />
                ))}
              </nav>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all mt-6"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
