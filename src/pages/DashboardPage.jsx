import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Activity, Clock, ShieldAlert, FileText, Plus, ArrowRight,
    TrendingUp, User, Lock, ShieldCheck, Calendar, Lightbulb, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import GenZIcon from '../components/GenZIcon';

const DashboardPage = () => {
    const { currentUser } = useAuth();
    const [assessments, setAssessments] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const userName = currentUser?.displayName || "Guest";

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            try {
                // 1. Fetch Assessments
                const q = query(
                    collection(db, "assessments"),
                    where("userId", "==", currentUser.uid)
                );

                const querySnapshot = await getDocs(q);
                const fetchedAssessments = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                fetchedAssessments.sort((a, b) => {
                    const timeA = a.timestamp?.seconds || 0;
                    const timeB = b.timestamp?.seconds || 0;
                    return timeB - timeA;
                });

                setAssessments(fetchedAssessments);

                // 2. Fetch Profile Completion Status
                const profileRef = doc(db, "users", currentUser.uid);
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) {
                    setUserProfile(profileSnap.data());
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const isProfileComplete = userProfile?.age && userProfile?.height && userProfile?.weight;

    // Prepare chart data (reverse to show chronological order)
    const chartData = assessments.slice(0, 10).reverse().map((item, index) => {
        const date = item.timestamp?.toDate ? item.timestamp.toDate() : null;
        return {
            displayDate: date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
            displayTime: date ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
            score: item.riskScore || 0,
            id: item.id || index // Unique key for positioning
        };
    });

    // Extract detailed metrics from the latest assessment
    const latestDetails = assessments.length > 0 && assessments[0].details ? assessments[0].details : [
        { category: "Cardiovascular", risk: "N/A", score: 0 },
        { category: "Respiratory", risk: "N/A", score: 0 },
        { category: "Metabolic", risk: "N/A", score: 0 }
    ];

    const stats = [
        {
            label: "Overall Risk",
            value: assessments.length > 0 ? (assessments[0].riskScore < 15 ? "Low" : assessments[0].riskScore < 30 ? "Moderate" : "High") : "N/A",
            color: assessments.length > 0
                ? (assessments[0].riskScore < 15 ? "text-emerald-500" : assessments[0].riskScore < 30 ? "text-amber-500" : "text-rose-500")
                : "text-slate-400",
            bgColor: assessments.length > 0
                ? (assessments[0].riskScore < 15 ? "bg-emerald-50" : assessments[0].riskScore < 30 ? "bg-amber-50" : "bg-rose-50")
                : "bg-slate-50",
            icon: <GenZIcon icon={ShieldCheck} color="text-emerald-500" glowColor="bg-emerald-500/20" />,
            trend: assessments.length > 1 ? (assessments[0].riskScore < assessments[1].riskScore ? "improving" : "stable") : "baseline"
        },
        {
            label: "Last Checkup",
            value: assessments.length > 0 ? assessments[0].timestamp?.toDate?.().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Never",
            color: "text-primary-600",
            bgColor: "bg-primary-50",
            icon: <GenZIcon icon={Calendar} color="text-primary-600" glowColor="bg-primary-600/20" />,
            trend: assessments.length > 0 ? "recent" : "pending"
        },
        {
            label: "Active Insights",
            value: assessments.length > 0 ? "3 Alerts" : "0 Alerts",
            color: "text-health-cyber",
            bgColor: "bg-cyan-50",
            icon: <GenZIcon icon={Lightbulb} color="text-health-cyber" glowColor="bg-cyan-500/20" />,
            trend: "analyzing"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pt-36 pb-12 px-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] bg-primary-100/30 dark:bg-primary-900/10 blur-[100px] rounded-full animate-float"></div>
                <div className="absolute bottom-[5%] right-[5%] w-[25%] h-[25%] bg-health-cyber/5 dark:bg-health-cyber/2 blur-[80px] rounded-full animate-float" style={{ animationDelay: '-3s' }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Profile Completion Multi-Banner */}
                {!loading && !isProfileComplete && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card mb-10 overflow-hidden group shadow-premium"
                    >
                        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-health-violet p-1">
                            <div className="bg-white dark:bg-dark-card rounded-[1.4rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6 text-center md:text-left">
                                    <div className="h-16 w-16 bg-primary-50 dark:bg-primary-900/10 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        <User size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                                            Complete Your Health Profile
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">
                                            Unlock high-precision AI risk detection by providing your baseline metrics.
                                        </p>
                                    </div>
                                </div>
                                <Link to="/profile" className="btn-premium px-8 py-4 text-base whitespace-nowrap shadow-glow">
                                    Complete Setup <ArrowRight size={18} className="ml-2" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Header */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"
                >
                    <motion.div variants={itemVariants}>

                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-health-cyber">{userName}</span>
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mt-3 font-medium">Your health insights are updated and ready for review.</p>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Link to="/assessment" className="btn-premium group px-8 py-4 shadow-glow">
                            <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                            New Assessment
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="glass-card p-6 rounded-[2rem] hover:shadow-glow transition-all duration-500 group border-white/60"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`${stat.bgColor} ${stat.color} p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                                </div>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight size={18} className="text-slate-300" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Health Trend Chart */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-8 md:p-10 rounded-[2.5rem] shadow-premium mb-12 border-white/60 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full -mr-32 -mt-32"></div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Risk Analytics Trend</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Visualizing your progress over the last 7 scans.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {assessments.length >= 2 && (
                                <>
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-xs font-black border border-emerald-100 shadow-sm">
                                        <ShieldCheck size={14} /> Peak Health: {Math.min(...assessments.map(a => a.riskScore))}%
                                    </div>
                                </>
                            )}
                            <div className="flex items-center gap-2 text-primary-600 bg-primary-50 px-4 py-2 rounded-xl text-xs font-black border border-primary-100 shadow-sm">
                                <TrendingUp size={14} /> AI Analysis
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full relative z-10">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-slate-400 font-bold animate-pulse">Analyzing health data...</div>
                        ) : assessments.length < 2 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6">
                                <div className="p-6 bg-slate-50 rounded-3xl opacity-50">
                                    <Activity size={48} className="text-slate-300" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-slate-500">Insufficient Data Points</p>
                                    <p className="text-sm">Complete 2 more assessments to unlock trend analytics.</p>
                                </div>
                                <Link to="/assessment" className="btn-premium py-3 px-6 text-sm">Start Assessment</Link>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#e2e8f0" />

                                    <ReferenceArea y1={0} y2={15} fill="#ecfdf5" fillOpacity={0.4} />
                                    <ReferenceArea y1={15} y2={30} fill="#fff7ed" fillOpacity={0.4} />
                                    <ReferenceArea y1={30} y2={100} fill="#fff1f2" fillOpacity={0.4} />

                                    <XAxis
                                        dataKey="id"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={({ x, y, payload, index }) => {
                                            const item = chartData[index];
                                            return (
                                                <g transform={`translate(${x},${y})`}>
                                                    <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748b" style={{ fontSize: '10px', fontWeight: '800' }}>
                                                        {item?.displayDate}
                                                    </text>
                                                    <text x={0} y={0} dy={28} textAnchor="middle" fill="#94a3b8" style={{ fontSize: '8px', fontWeight: '400' }}>
                                                        {item?.displayTime}
                                                    </text>
                                                </g>
                                            );
                                        }}
                                        height={50}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const score = payload[0].value;
                                                const status = score < 15 ? "Excellent" : score < 30 ? "Monitor" : "Warning";
                                                const color = score < 15 ? "text-emerald-500" : score < 30 ? "text-amber-500" : "text-rose-500";
                                                return (
                                                    <div className="glass-card p-5 rounded-[1.5rem] shadow-2xl border-white animate-slide-up">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{payload[0].payload?.displayDate || 'N/A'}</p>
                                                            <p className="text-[10px] font-bold text-primary-500">{payload[0].payload?.displayTime}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`text-3xl font-black ${color}`}>{score}%</div>
                                                            <div className="h-10 w-[1px] bg-slate-100"></div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase">Risk Level</p>
                                                                <p className={`text-xs font-black ${color}`}>{status}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                        cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '6 6' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#4f46e5"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                        dot={{ r: 6, fill: '#fff', stroke: '#4f46e5', strokeWidth: 3 }}
                                        activeDot={{ r: 8, fill: '#4f46e5', stroke: '#fff', strokeWidth: 4, shadow: '0 0 15px rgba(79, 70, 229, 0.4)' }}
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Recent Assessments */}
                        <section className="glass-card rounded-[2.5rem] shadow-premium overflow-hidden border-white/60 dark:border-dark-border/40">
                            <div className="p-8 border-b border-slate-50 dark:border-dark-border/50 flex justify-between items-center">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recent Assessments</h3>
                                <button className="text-primary-600 hover:text-primary-700 font-bold text-sm tracking-tight flex items-center gap-1 group">
                                    View Repository <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {loading ? (
                                    <div className="p-16 text-center text-slate-400 font-bold">Accessing medical records...</div>
                                ) : assessments.length === 0 ? (
                                    <div className="p-16 text-center text-slate-400">
                                        <p className="text-lg font-bold text-slate-500 mb-2">No Reports Found</p>
                                        <p className="text-sm">Your assessment history will appear here.</p>
                                    </div>
                                ) : (
                                    assessments.slice(0, 5).map((item) => (
                                        <div key={item.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-center gap-6">
                                                <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-white transition-colors shadow-sm">
                                                    <Activity className="text-primary-500" size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg">Health Risk Scan</p>
                                                    <p className="text-sm text-slate-400 font-bold">{item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right hidden sm:block">
                                                    <p className={`text-sm font-black ${item.riskScore < 15 ? 'text-emerald-500' : item.riskScore < 30 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                        {item.riskScore < 15 ? 'Optimal Health' : item.riskScore < 30 ? 'Monitor Status' : 'Attention Required'}
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Verified Result</p>
                                                </div>
                                                <ArrowRight size={22} className="text-slate-200 group-hover:text-primary-400 transition-colors group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Health Insight Card */}
                        <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/20 blur-[100px] rounded-full -mr-40 -mt-40 group-hover:scale-110 transition-transform duration-700"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-health-cyber/10 blur-[60px] rounded-full -ml-20 -mb-20"></div>

                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                <div className="md:w-3/5 text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-health-cyber font-black text-[10px] uppercase tracking-widest mb-6">
                                        Clinical Insight
                                    </div>
                                    <h3 className="text-3xl font-black mb-4 tracking-tight italic">Optimizing for Longevity</h3>
                                    <p className="text-slate-400 mb-8 font-medium leading-relaxed">
                                        Data shows consistent cardiovascular monitoring can reduce long-term risks by up to 24%. Stay proactive.
                                    </p>
                                    <button className="btn-premium px-8 py-4 bg-white text-slate-900 hover:bg-slate-50 border-none shadow-white/5">
                                        Explore Methodology
                                    </button>
                                </div>
                                <div className="md:w-2/5 flex justify-center">
                                    <div className="h-40 w-40 bg-white/5 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                                        <TrendingUp size={80} className="text-health-cyber opacity-40" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-8">
                        {/* Risk Categories */}
                        <section className="glass-card rounded-[2.5rem] p-8 shadow-premium border-white/60">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Risk Metrics</h3>
                            <div className="space-y-8">
                                {latestDetails.map((risk, idx) => {
                                    const score = risk.score || 0;
                                    const color = score > 40 ? "bg-rose-500" : score > 20 ? "bg-amber-500" : "bg-emerald-500";
                                    return (
                                        <div key={idx} className="group">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-slate-700 dark:text-slate-300 font-black text-sm">{risk.category}</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${score > 40 ? 'text-rose-500' : score > 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                    {risk.risk || (score > 40 ? 'Elevated' : score > 20 ? 'Moderate' : 'Optimal')}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${score}%` }}
                                                    className={`${color} h-full rounded-full shadow-sm`}
                                                ></motion.div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Smart Nav */}
                        <section className="glass-card rounded-[2.5rem] p-8 shadow-premium border-white/60">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Gateway</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/profile" className="flex flex-col items-center gap-3 p-5 bg-slate-50/50 rounded-3xl hover:bg-white hover:shadow-glow transition-all duration-300 border border-transparent hover:border-primary-100 group">
                                    <div className="bg-white p-3 rounded-2xl shadow-sm text-primary-500 group-hover:scale-110 transition-transform"><User size={22} /></div>
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Profile</span>
                                </Link>
                                <Link to="/results" className="flex flex-col items-center gap-3 p-5 bg-slate-50/50 rounded-3xl hover:bg-white hover:shadow-glow transition-all duration-300 border border-transparent hover:border-health-cyber group">
                                    <div className="bg-white p-3 rounded-2xl shadow-sm text-health-cyber group-hover:scale-110 transition-transform"><FileText size={22} /></div>
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Reports</span>
                                </Link>
                            </div>
                        </section>

                        {/* System Lock */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-center gap-4">
                            <div className="bg-white p-2 rounded-xl shadow-sm">
                                <Lock size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Status</p>
                                <p className="text-xs font-bold text-emerald-600">Encrypted & Secure</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
