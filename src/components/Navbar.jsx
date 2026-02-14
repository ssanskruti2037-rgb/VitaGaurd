import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Info, Sparkles, LayoutDashboard, LogOut, Sun, Moon, Zap, User, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Navbar = () => {
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const toggleMenu = () => setIsOpen(!isOpen);

    const navLinks = [
        { name: 'Home', path: '/', icon: <Home size={20} /> },
        { name: 'How it works', path: '/#how-it-works', icon: <Info size={20} /> },
        { name: 'Features', path: '/#features', icon: <Sparkles size={20} /> },
    ];

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-dark-bg/70 backdrop-blur-xl border-b border-white/20 dark:border-dark-border/50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="bg-primary-600 p-2 rounded-xl shadow-glow group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center h-10 w-10">
                            <Zap className="h-6 w-6 text-white" fill="currentColor" />
                        </div>
                        <span className="text-2xl font-black bg-gradient-to-r from-primary-700 via-primary-600 to-health-cyber bg-clip-text text-transparent tracking-tight">
                            VitaGuard
                        </span>
                    </Link>

                    {/* Desktop Links - Symbols Only */}
                    <div className="hidden md:flex items-center space-x-10">
                        <div className="flex items-center space-x-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                            {navLinks.map((link) => (
                                <motion.button
                                    key={link.name}
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,1)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        if (link.path.startsWith('/#')) {
                                            const id = link.path.split('#')[1];
                                            const element = document.getElementById(id);
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth' });
                                            } else {
                                                navigate(link.path);
                                            }
                                        } else {
                                            navigate(link.path);
                                        }
                                    }}
                                    className="p-3 text-slate-500 hover:text-primary-600 rounded-xl transition-colors relative group"
                                    title={link.name}
                                >
                                    {link.icon}
                                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">
                                        {link.name}
                                    </span>
                                </motion.button>
                            ))}

                            {/* Theme Toggle Button */}
                            <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255,255,255,1)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleTheme}
                                className="p-3 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-xl transition-colors relative group"
                                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest whitespace-nowrap">
                                    {theme === 'dark' ? 'Light' : 'Dark'}
                                </span>
                            </motion.button>
                        </div>

                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

                        {currentUser ? (
                            <div className="flex items-center space-x-4">
                                <Link to="/dashboard" className="p-3 text-slate-500 hover:text-primary-600 hover:bg-white rounded-xl transition-all relative group" title="Dashboard">
                                    <LayoutDashboard size={20} />
                                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">Dashboard</span>
                                </Link>
                                <Link to="/profile" className="flex items-center gap-3 bg-white dark:bg-dark-card px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border hover:border-primary-200 transition-all text-slate-700 dark:text-slate-200 font-bold text-sm">
                                    <div className="bg-primary-50 dark:bg-primary-900/10 p-1 rounded-lg">
                                        <User size={16} className="text-primary-600 dark:text-primary-400" />
                                    </div>
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group relative"
                                    title="Logout"
                                >
                                    <LogOut size={20} />
                                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">Logout</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-bold text-sm">Login</Link>
                                <Link to="/signup" className="btn-primary py-2.5 px-6 text-sm">Sign Up</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <button onClick={toggleMenu} className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-xl shadow-2xl absolute w-[90%] left-[5%] top-20 rounded-[2.5rem] border border-slate-100 overflow-hidden animate-fade-in z-[110]">
                    <div className="p-8 space-y-4">
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {navLinks.map((link) => (
                                <button
                                    key={link.name}
                                    onClick={() => {
                                        setIsOpen(false);
                                        if (link.path.startsWith('/#')) {
                                            const id = link.path.split('#')[1];
                                            const element = document.getElementById(id);
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth' });
                                            } else {
                                                navigate(link.path);
                                            }
                                        } else {
                                            navigate(link.path);
                                        }
                                    }}
                                    className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-100 transition-all group"
                                >
                                    <div className="text-slate-400 dark:text-slate-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                                        {link.icon}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{link.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            {currentUser ? (
                                <>
                                    <Link to="/dashboard" className="flex items-center gap-4 p-4 text-slate-600 font-bold rounded-2xl hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                                        <LayoutDashboard size={20} /> Dashboard
                                    </Link>
                                    <Link to="/profile" className="flex items-center gap-4 p-4 text-primary-600 font-black rounded-2xl bg-primary-50" onClick={() => setIsOpen(false)}>
                                        <User size={20} /> My Health Profile
                                    </Link>
                                    <button onClick={() => { handleLogout(); setIsOpen(false); }} className="flex items-center gap-4 w-full p-4 text-rose-500 font-bold">
                                        <LogOut size={20} /> Logout
                                    </button>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <Link to="/login" className="btn-secondary py-4 text-center" onClick={() => setIsOpen(false)}>Login</Link>
                                    <Link to="/signup" className="btn-primary py-4 text-center" onClick={() => setIsOpen(false)}>Sign Up</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
