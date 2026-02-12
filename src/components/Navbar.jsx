import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, HeartPulse, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'How It Works', path: '/#how-it-works' },
        { name: 'Features', path: '/#features' },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <HeartPulse className="h-8 w-8 text-primary-600" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-health-teal bg-clip-text text-transparent italic">
                            VitaGuard
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.path}
                                className="text-slate-600 hover:text-primary-600 font-medium transition-colors"
                            >
                                {link.name}
                            </a>
                        ))}

                        {currentUser ? (
                            <div className="flex items-center space-x-6">
                                <Link to="/dashboard" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Dashboard</Link>
                                <Link to="/profile" className="flex items-center gap-2 text-slate-600 hover:text-primary-600 font-medium bg-slate-50 px-3 py-1.5 rounded-xl transition-all border border-slate-100 italic">
                                    <User size={16} className="text-primary-600" />
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-200 transition-all"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link to="/login" className="text-slate-600 hover:text-primary-600 font-medium">Login</Link>
                                <Link to="/signup" className="btn-primary py-2 px-6">Sign Up</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={toggleMenu} className="text-slate-600 hover:text-primary-600">
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white shadow-lg absolute w-full top-full left-0 animate-fade-in">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.path}
                                className="block px-3 py-2 text-slate-600 hover:text-primary-600 font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </a>
                        ))}
                        <hr className="my-2 border-slate-100" />
                        {currentUser ? (
                            <>
                                <Link to="/dashboard" className="block px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50" onClick={() => setIsOpen(false)}>Dashboard</Link>
                                <Link to="/profile" className="block px-3 py-2 text-primary-600 font-bold rounded-lg bg-primary-50" onClick={() => setIsOpen(false)}>Health Profile</Link>
                                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-slate-600">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="block px-3 py-2 text-slate-600" onClick={() => setIsOpen(false)}>Login</Link>
                                <Link to="/signup" className="block px-3 py-2 text-primary-600 font-bold" onClick={() => setIsOpen(false)}>Sign Up</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
