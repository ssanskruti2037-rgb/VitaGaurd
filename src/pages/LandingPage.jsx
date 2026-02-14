import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, LineChart, Lock, ArrowRight, CheckCircle2, X, Microscope, Database, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
    const { currentUser } = useAuth();
    const [activeStep, setActiveStep] = useState(null);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
    };

    const stepDetails = {
        "01": {
            title: "Biometric Intake Protocol",
            subtitle: "Data Collection & Calibration",
            icon: <Microscope size={32} className="text-blue-500" />,
            content: "Our system gathers baseline health markers including age, gender, BMI (via height/weight), and specific physical symptoms. This phase uses 'Smart Matching' to cross-reference your inputs with demographic risk pools.",
            features: ["Personal Health Profiling", "Symptom Categorization", "Baseline Calibration"],
            color: "from-blue-600 to-indigo-600"
        },
        "02": {
            title: "Neural Analysis Engine",
            subtitle: "Algorithmic Risk Assessment",
            icon: <Database size={32} className="text-cyan-500" />,
            content: "Your data is processed through our Vita-Neural engine. We compare your symptoms against 10,000+ medical case studies to identify early-stage risk markers for cardiovascular, respiratory, and metabolic conditions.",
            features: ["Pattern Recognition", "Medical Database Scanning", "Probability Scoring"],
            color: "from-health-cyber to-blue-500"
        },
        "03": {
            title: "Clinical Synthesis",
            subtitle: "Intelligent Action Planning",
            icon: <FileText size={32} className="text-slate-800" />,
            content: "The final output is a clinical-grade risk report. Our AI generates personalized precautions and calculates a 'Severity Score' to help you determine if immediate medical consultation is required.",
            features: ["Risk Level Classification", "Custom Precautions", "PDF Health Documentation"],
            color: "from-slate-800 to-slate-900"
        }
    };

    return (
        <div className="overflow-x-hidden bg-white selection:bg-primary-100 selection:text-primary-700">
            {/* Modal Overlay */}
            <AnimatePresence>
                {activeStep && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveStep(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl glass-card rounded-[3rem] p-8 md:p-12 overflow-hidden shadow-2xl border-white"
                        >
                            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${stepDetails[activeStep].color} opacity-10 blur-[80px] -mr-32 -mt-32`}></div>

                            <button
                                onClick={() => setActiveStep(null)}
                                className="absolute top-8 right-8 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
                            >
                                <X size={20} />
                            </button>

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                        {stepDetails[activeStep].icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em] mb-1">{stepDetails[activeStep].subtitle}</p>
                                        <h3 className="text-3xl font-black text-slate-900">{stepDetails[activeStep].title}</h3>
                                    </div>
                                </div>

                                <p className="text-slate-600 text-lg leading-relaxed mb-10 font-medium">
                                    {stepDetails[activeStep].content}
                                </p>

                                <div className="space-y-4">
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Key Capabilities</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {stepDetails[activeStep].features.map((f, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                                <span className="font-bold text-slate-700">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-12 pt-8 border-t border-slate-100">
                                    <button
                                        onClick={() => setActiveStep(null)}
                                        className="w-full btn-premium py-5 text-lg"
                                    >
                                        Got it, Proceed <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-100/50 blur-[120px] rounded-full animate-float"></div>
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-health-cyber/10 blur-[100px] rounded-full animate-float" style={{ animationDelay: '-2s' }}></div>
                <div className="absolute bottom-[10%] left-[20%] w-[25%] h-[25%] bg-health-violet/10 blur-[100px] rounded-full animate-float" style={{ animationDelay: '-4s' }}></div>
            </div>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center pt-28 pb-20 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={containerVariants}
                            className="text-center lg:text-left"
                        >


                            <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
                                Health Risk <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-health-cyber">Detection</span> Reimagined.
                            </motion.h1>

                            <motion.p variants={itemVariants} className="text-xl text-slate-500 mb-12 max-w-xl lg:mx-0 mx-auto leading-relaxed font-medium">
                                Stay ahead of medical concerns with VitaGuard's sophisticated AI engine. We analyze your data to provide clinical-grade insights before they become serious.
                            </motion.p>

                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                                <Link to={currentUser ? "/dashboard" : "/signup"} className="btn-premium group text-lg px-10 py-5 text-center">
                                    {currentUser ? "Go to Dashboard" : "Get Started Free"}
                                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <button
                                    onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                                    className="flex items-center justify-center px-10 py-5 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all text-lg"
                                >
                                    Explore Features
                                </button>
                            </motion.div>

                        </motion.div>

                        <motion.div
                            className="relative lg:h-[600px] flex items-center justify-center"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="relative z-10 group">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-primary-400 to-health-cyber rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                <div className="glass-card p-3 rounded-[2.5rem] shadow-glass relative">
                                    <img
                                        src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800"
                                        alt="Doctor using tablet"
                                        className="rounded-[2rem] shadow-inner w-full h-[500px] object-cover"
                                    />
                                    {/* Floater UI 1 - Precision */}
                                    <motion.div
                                        animate={{ y: [0, -12, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -top-6 -right-12 bg-white p-5 rounded-[2rem] shadow-premium border-2 border-primary-100 flex items-center gap-4 z-30"
                                    >
                                        <div className="bg-emerald-50 p-2.5 rounded-xl shadow-sm border border-emerald-100">
                                            <Activity className="text-emerald-500 h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">AI Engine</p>
                                            <p className="text-xl font-black text-primary-900 leading-none">98.4% <span className="text-xs font-bold text-slate-400 ml-1">Precision</span></p>
                                        </div>
                                    </motion.div>

                                    {/* Floater UI 2 - Status */}
                                    <motion.div
                                        animate={{ y: [0, 12, 0] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -bottom-8 -left-12 bg-white p-5 rounded-[2rem] shadow-premium border-2 border-primary-100 flex items-center gap-4 z-30"
                                    >
                                        <div className="bg-primary-50 p-2.5 rounded-xl shadow-sm border border-primary-100">
                                            <ShieldCheck className="text-primary-600 h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Trust Score</p>
                                            <p className="text-xl font-black text-primary-900 leading-none italic tracking-tighter">Verified <span className="text-xs font-bold text-health-cyber ml-1">✓</span></p>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-32 bg-white relative overflow-hidden">
                {/* Visual Connection Line (Desktop) */}
                <div className="absolute top-[60%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-100 to-transparent hidden md:block z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-24">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] mb-6"
                        >
                            The Protocol
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6"
                        >
                            Precision <span className="italic text-primary-600">Workflow</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
                        >
                            Our diagnostic engine transforms raw data into clinical intelligence through a three-stage neural architecture.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {[
                            {
                                step: "01",
                                icon: <Activity className="text-white" size={28} />,
                                title: "Biometric Intake",
                                desc: "Our intelligent gateway synchronizes with your existing health metrics and symptoms.",
                                color: "from-blue-600 to-indigo-600",
                                glow: "bg-blue-400/20"
                            },
                            {
                                step: "02",
                                icon: <LineChart className="text-white" size={28} />,
                                title: "Neural Processing",
                                desc: "Thousands of medical data points are scanned against your profile using our pro-logic models.",
                                color: "from-health-cyber to-blue-500",
                                glow: "bg-cyan-400/20"
                            },
                            {
                                step: "03",
                                icon: <CheckCircle2 className="text-white" size={28} />,
                                title: "Clinical Synthesis",
                                desc: "A high-fidelity report is generated with exact risk classifications and preventive measures.",
                                color: "from-slate-800 to-slate-900",
                                glow: "bg-emerald-400/10"
                            }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2, duration: 0.8 }}
                                className="relative group cursor-pointer"
                                onClick={() => setActiveStep(item.step)}
                            >
                                {/* Step Indicator Shadow */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8rem] font-black text-slate-50 opacity-[0.03] select-none group-hover:opacity-[0.07] transition-opacity duration-700">
                                    {item.step}
                                </div>

                                <div className="glass-card p-10 rounded-[3rem] border-slate-100 hover:border-white hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 h-full flex flex-col items-center text-center group">
                                    {/* Icon Container with Gradient Orb */}
                                    <div className="relative mb-8">
                                        <div className={`absolute inset-0 ${item.glow} blur-2xl rounded-full scale-150 group-hover:scale-[2] transition-transform duration-700`}></div>
                                        <div className={`relative bg-gradient-to-br ${item.color} p-6 rounded-[2rem] shadow-lg shadow-blue-500/10 transform group-hover:rotate-12 transition-transform duration-500`}>
                                            {item.icon}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full mb-3 inline-block">Stage {item.step}</span>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{item.title}</h3>
                                        </div>
                                    </div>

                                    <p className="text-slate-500 leading-relaxed font-medium">
                                        {item.desc}
                                    </p>

                                    {/* Action Label */}
                                    <div className="mt-6 text-primary-600 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                        View Protocol Details <ArrowRight size={14} />
                                    </div>

                                    {/* Bottom Decorative Element */}
                                    <div className={`w-12 h-1 bg-gradient-to-r ${item.color} rounded-full mt-8 opacity-20 group-hover:opacity-100 group-hover:w-20 transition-all duration-500`}></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 bg-slate-50/50 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="w-full lg:w-1/2">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
                                    Premium Features for Your <span className="text-primary-600">Health</span>
                                </h2>
                                <p className="text-lg text-slate-500 mb-12 font-medium">
                                    Our platform combines medical expertise with advanced AI to give you the most accurate proactive health tools.
                                </p>
                            </motion.div>
                            <div className="space-y-6">
                                {[
                                    { icon: <Activity className="text-primary-500" />, title: "Symptom Checker", desc: "Detailed analysis of your current physical symptoms." },
                                    { icon: <LineChart className="text-health-teal" />, title: "Predictive Analytics", desc: "Identify long-term health risks based on lifestyle data." },
                                    { icon: <Lock className="text-health-green" />, title: "Secure Data Storage", desc: "Your health records are encrypted and kept strictly private." },
                                    { icon: <ShieldCheck className="text-primary-600" />, title: "Early Warnings", desc: "Prevent serious illness with proactive health indicators." }
                                ].map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm mt-1">{feature.icon}</div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-800 mb-1">{feature.title}</h4>
                                            <p className="text-slate-600">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4 pt-8">
                                    <div className="bg-white p-2 rounded-2xl overflow-hidden shadow-lg h-60">
                                        <img src="https://images.unsplash.com/photo-1504813184591-01572f98c85f?auto=format&fit=crop&q=80&w=400" alt="Health 1" className="w-full h-full object-cover rounded-xl" />
                                    </div>
                                    <div className="bg-white p-2 rounded-2xl overflow-hidden shadow-lg h-40">
                                        <img src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=400" alt="Health 2" className="w-full h-full object-cover rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white p-2 rounded-2xl overflow-hidden shadow-lg h-40">
                                        <img src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600" alt="Advanced Medical Laboratory" className="w-full h-full object-cover rounded-xl" />
                                    </div>
                                    <div className="bg-white p-2 rounded-2xl overflow-hidden shadow-lg h-60">
                                        <img src="https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=600" alt="Modern Diagnostic Interface" className="w-full h-full object-cover rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 relative z-10 overflow-hidden">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-slate-900 rounded-[3.5rem] p-16 md:p-24 text-center text-white relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/20 blur-[120px] rounded-full -mr-64 -mt-64 animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-health-cyber/10 blur-[100px] rounded-full -ml-40 -mb-40"></div>

                        <div className="relative z-10">
                            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-none italic">
                                Ready for a <span className="text-primary-400">Healthier</span> Future?
                            </h2>
                            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium">
                                Join our growing community of proactive individuals who trust VitaGuard for their daily health insights.
                            </p>
                            <Link to={currentUser ? "/dashboard" : "/signup"} className="btn-premium px-12 py-6 text-xl bg-white text-slate-900 hover:bg-slate-50 border-none shadow-white/10">
                                {currentUser ? "Go to Dashboard" : "Get Started Now — It's Free"}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
