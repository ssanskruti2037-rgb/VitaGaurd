import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Clock, ShieldAlert, FileText, Plus, ArrowRight, TrendingUp, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

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
    const chartData = assessments.slice(0, 7).reverse().map(item => ({
        date: item.timestamp?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: item.riskScore
    }));

    const stats = [
        {
            label: "Overall Risk",
            value: assessments.length > 0 ? (assessments[0].riskScore < 20 ? "Low" : "Moderate") : "N/A",
            color: "bg-health-green",
            icon: <ShieldAlert className="text-white" />
        },
        {
            label: "Last Checkup",
            value: assessments.length > 0 ? assessments[0].timestamp?.toDate().toLocaleDateString() : "Never",
            color: "bg-primary-500",
            icon: <Clock className="text-white" />
        },
        {
            label: "Assessments",
            value: assessments.length.toString(),
            color: "bg-health-teal",
            icon: <FileText className="text-white" />
        }
    ];

    return (
        <div className="bg-slate-50 min-h-screen pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Profile Completion Multi-Banner */}
                {!loading && !isProfileComplete && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-indigo-600 rounded-3xl p-6 md:p-8 mb-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
                    >
                        <div className="relative z-10 text-center md:text-left">
                            <h2 className="text-2xl font-black mb-2 flex items-center justify-center md:justify-start gap-3 uppercase tracking-tight">
                                <Activity className="text-indigo-200" /> Complete Your Health Profile
                            </h2>
                            <p className="text-indigo-100 font-medium max-w-lg">
                                For high-precision AI risk detection, we need your baseline metrics like age, height, and weight.
                            </p>
                        </div>
                        <Link to="/profile" className="relative z-10 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-xl whitespace-nowrap">
                            Complete Setup →
                        </Link>
                        {/* Decorative BG element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    </motion.div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-3xl font-bold text-slate-800">Hello, {userName}! 👋</h1>
                        <p className="text-slate-500 mt-1">Here's a summary of your health status.</p>
                    </motion.div>

                    <Link to="/assessment" className="btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        Start New Assessment
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6"
                        >
                            <div className={`${stat.color} p-4 rounded-2xl shadow-lg`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Health Trend Chart */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-12"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Risk Analytics Trend</h3>
                            <p className="text-sm text-slate-500">Historical performance of your early detection scans.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {assessments.length >= 2 && (
                                <>
                                    <div className="flex items-center gap-2 text-health-green bg-green-50 px-3 py-1 rounded-lg text-xs font-bold border border-green-100">
                                        Min: {Math.min(...assessments.map(a => a.riskScore))}%
                                    </div>
                                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1 rounded-lg text-xs font-bold border border-rose-100">
                                        Peak: {Math.max(...assessments.map(a => a.riskScore))}%
                                    </div>
                                </>
                            )}
                            <div className="flex items-center gap-2 text-primary-600 bg-primary-50 px-3 py-1 rounded-lg text-xs font-bold border border-primary-100">
                                <TrendingUp size={14} />
                                AI Insight Active
                            </div>
                        </div>
                    </div>

                    <div className="h-[320px] w-full min-h-[320px]">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-slate-400">Loading your health data...</div>
                        ) : assessments.length < 2 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                                <Activity size={32} className="opacity-20 translate-y-2" />
                                <p className="text-sm">Complete at least 2 assessments to see your health trend line.</p>
                                <Link to="/assessment" className="text-primary-600 text-sm font-bold hover:underline">Take another test →</Link>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                                    {/* Risk Zones */}
                                    <ReferenceArea y1={0} y2={15} fill="#f0fdf4" fillOpacity={0.6} label={{ position: 'insideLeft', value: 'SAFE', fill: '#16a34a', fontSize: 10, fontWeight: 'bold' }} />
                                    <ReferenceArea y1={15} y2={30} fill="#fffbeb" fillOpacity={0.6} label={{ position: 'insideLeft', value: 'MONITOR', fill: '#d97706', fontSize: 10, fontWeight: 'bold' }} />
                                    <ReferenceArea y1={30} y2={100} fill="#fef2f2" fillOpacity={0.6} label={{ position: 'insideLeft', value: 'HIGH', fill: '#dc2626', fontSize: 10, fontWeight: 'bold' }} />

                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                        dy={15}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        domain={[0, 45]}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const score = payload[0].value;
                                                const status = score < 15 ? "Excellent" : score < 30 ? "Monitor" : "Attention Required";
                                                const color = score < 15 ? "text-health-green" : score < 30 ? "text-amber-500" : "text-rose-500";
                                                return (
                                                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100 animate-slide-up">
                                                        <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{payload[0].payload.date}</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`text-2xl font-black ${color}`}>{score}%</div>
                                                            <div className="h-8 w-[1px] bg-slate-100"></div>
                                                            <div className="text-xs font-bold text-slate-600 leading-tight">
                                                                Risk Level<br />
                                                                <span className={color}>{status}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                        cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '6 6' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#2563eb"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                        dot={{ r: 6, fill: '#fff', stroke: '#2563eb', strokeWidth: 3 }}
                                        activeDot={{ r: 8, fill: '#2563eb', stroke: '#fff', strokeWidth: 4, shadow: '0 0 10px rgba(37, 99, 235, 0.5)' }}
                                        animationDuration={2000}
                                        animationEasing="ease-in-out"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Recent Assessments */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-800">Recent Assessments</h3>
                                <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">View All</button>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {loading ? (
                                    <div className="p-12 text-center text-slate-400">Loading your reports...</div>
                                ) : assessments.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">No assessments found. Start one today!</div>
                                ) : (
                                    assessments.slice(0, 5).map((item) => (
                                        <div key={item.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-slate-100 p-2 rounded-lg">
                                                    <Activity className="text-slate-400" size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">Risk Assessment</p>
                                                    <p className="text-sm text-slate-500">{item.timestamp?.toDate().toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`font-bold ${item.riskScore < 20 ? 'text-health-green' : 'text-amber-500'}`}>
                                                    {item.riskScore < 20 ? 'Low Risk' : 'Moderate Risk'}
                                                </span>
                                                <ArrowRight size={18} className="text-slate-300" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Health Tips Card */}
                        <section className="bg-gradient-to-r from-health-teal to-primary-600 rounded-3xl p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -mr-16 -mt-16"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                <div className="md:w-2/3">
                                    <h3 className="text-2xl font-bold mb-4">Improve your sleep quality</h3>
                                    <p className="text-primary-50 mb-6">Users with consistent sleep patterns show an 18% lower risk of cardiovascular issues. Try to sleep 7.5 hours tonight.</p>
                                    <button className="bg-white text-primary-600 px-6 py-2 rounded-full font-bold text-sm">Read Article</button>
                                </div>
                                <div className="md:w-1/3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl flex items-center justify-center">
                                    <TrendingUp size={64} className="text-white/40" />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-8">
                        {/* Risk Breakdown */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">Risk Categories</h3>
                            <div className="space-y-6">
                                {[
                                    { name: "Cardiovascular", level: "Low", percentage: 12, color: "bg-health-green" },
                                    { name: "Respiratory", level: "Low", percentage: 8, color: "bg-health-green" },
                                    { name: "Metabolic", level: "Low", percentage: 15, color: "bg-health-green" }
                                ].map((risk, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-700 font-medium">{risk.name}</span>
                                            <span className="text-sm text-slate-500">{risk.level}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className={`${risk.color} h-2 rounded-full`} style={{ width: `${risk.percentage}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Quick Actions */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/profile" className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                                    <div className="bg-white p-3 rounded-xl shadow-sm text-primary-600 group-hover:scale-110 transition-transform"><User size={20} /></div>
                                    <span className="text-sm font-medium text-slate-700">Profile</span>
                                </Link>
                                <Link to="/dashboard" className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                                    <div className="bg-white p-3 rounded-xl shadow-sm text-health-teal group-hover:scale-110 transition-transform"><FileText size={20} /></div>
                                    <span className="text-sm font-medium text-slate-700">Reports</span>
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
