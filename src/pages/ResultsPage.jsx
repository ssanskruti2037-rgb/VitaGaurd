// Forced refresh for chatbot visibility check
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, Download, Share2, Info, Loader2, Lightbulb, Sparkles, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import MedicalReportTemplate from '../components/MedicalReportTemplate';
import { analyzeHealthWithGemini } from '../services/gemini';
import HealthChatBot from '../components/HealthChatBot';
import GenZIcon from '../components/GenZIcon';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

const ResultsPage = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const assessmentData = location.state || {};
    const reportRef = useRef(null);
    const pdfTemplateRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const currentName = assessmentData.name || currentUser?.displayName || "User";
    const formData = assessmentData.formData || {};

    // Trigger celebration if risk is low
    useEffect(() => {
        const result = getResultSync();
        if (result && result.riskLevel === "Low") {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, []);

    // Use Gemini AI analysis if available, otherwise call the deterministic fallback engine
    const getResult = () => {
        const aiAnalysis = assessmentData.aiAnalysis;

        if (aiAnalysis && aiAnalysis.success && aiAnalysis.data) {
            return {
                ...aiAnalysis.data,
                source: aiAnalysis.source
            };
        }

        // No AI analysis available — use the service's deterministic fallback
        // This happens when the assessment errored or the API was unreachable
        return null; // Will be resolved asynchronously below
    };

    // For synchronous rendering, we need the fallback to work inline
    const getResultSync = () => {
        const aiResult = getResult();
        if (aiResult) return aiResult;

        // Inline deterministic fallback (mirrors gemini.js fallback logic)
        return generateLocalAnalysis();
    };

    const generateLocalAnalysis = () => {
        const symptoms = formData.symptoms || [];
        const age = parseInt(formData.age) || 25;
        const weight = parseFloat(formData.weight) || 0;
        const height = parseFloat(formData.height) || 170;
        const heightM = height / 100;
        const bmi = weight > 0 ? weight / (heightM * heightM) : 22;

        // ========== DETERMINISTIC RISK SCORE ==========
        let riskScore = 0;
        if (symptoms.includes('None of the above') || symptoms.length === 0) {
            riskScore = 0;
        }

        const symptomWeights = {
            'Chest Pain': 6, 'Shortness of Breath': 5, 'Fatigue': 3,
            'Dizziness': 4, 'Persistent Cough': 3, 'Nausea': 3,
            'Frequent Urination': 4, 'Headache': 2
        };
        symptoms.forEach(s => { riskScore += symptomWeights[s] || 3; });

        // Co-occurrence bonuses
        if (symptoms.includes('Chest Pain') && symptoms.includes('Shortness of Breath')) riskScore += 5;
        if (symptoms.includes('Fatigue') && symptoms.includes('Dizziness')) riskScore += 3;

        // Lifestyle scoring
        const lifestyleScores = {
            sleep: { 'less_5': 5, '5_7': 2, '7_9': 0, '9_plus': 1 },
            exercise: { 'never': 5, 'sometimes': 2, 'regular': 0, 'daily': -1 },
            smoking: { 'non': 0, 'former': 2, 'occasional': 4, 'regular': 6 },
            alcohol: { 'none': 0, 'low': 1, 'moderate': 3, 'high': 5 }
        };
        riskScore += lifestyleScores.sleep[formData.sleep] || 0;
        riskScore += lifestyleScores.exercise[formData.exercise] || 0;
        riskScore += lifestyleScores.smoking[formData.smoking] || 0;
        riskScore += lifestyleScores.alcohol[formData.alcohol] || 0;

        // Age & BMI adjustments
        if (age > 50) riskScore += 4; else if (age > 40) riskScore += 2; else if (age > 30) riskScore += 1;
        if (bmi > 30) riskScore += 4; else if (bmi > 25) riskScore += 2; else if (bmi < 18.5) riskScore += 2;

        riskScore = Math.min(95, Math.max(0, riskScore));

        const getRiskLevel = (s) => s < 16 ? "Low" : s <= 35 ? "Moderate" : "High";
        const riskLevel = getRiskLevel(riskScore);

        // ========== RECOMMENDATIONS ==========
        const recommendations = [];
        if (symptoms.includes('Chest Pain')) recommendations.push("Consult a cardiologist for a detailed ECG and stress test.");
        if (symptoms.includes('Shortness of Breath')) recommendations.push("Schedule a pulmonary function test to assess respiratory capacity.");
        if (symptoms.includes('Fatigue')) recommendations.push("Get a complete blood panel to check iron, Vitamin D, and thyroid markers.");
        if (symptoms.includes('Dizziness')) recommendations.push("Monitor blood pressure twice daily and ensure 2.5L+ daily hydration.");
        if (symptoms.includes('Persistent Cough')) recommendations.push("If cough persists beyond 3 weeks, schedule a chest X-ray.");
        if (symptoms.includes('Nausea')) recommendations.push("Review diet and medications — nausea may indicate interactions or sensitivities.");
        if (symptoms.includes('Frequent Urination')) recommendations.push("Get fasting blood glucose and HbA1c to screen metabolic markers.");
        if (symptoms.includes('Headache')) recommendations.push("Track headache triggers for 2 weeks — consult a neurologist if frequent.");
        if (formData.sleep === 'less_5') recommendations.push("Increase sleep to 7-8 hours to lower cortisol and cardiovascular risk.");
        if (formData.exercise === 'never') recommendations.push("Begin with 20 min brisk walking daily — reduces all-cause mortality by 20%.");
        if (formData.smoking === 'regular') recommendations.push("Initiate a smoking cessation plan to reduce respiratory and cardiovascular risk.");
        if (recommendations.length === 0) {
            recommendations.push("Maintain your balanced routine — your metrics are within healthy ranges.");
            recommendations.push("Schedule annual preventive health screening for your age group.");
            recommendations.push("Continue physical activity and 2-3L daily hydration.");
            recommendations.push("Monitor any changes in energy or sleep patterns.");
        }

        // ========== TIPS ==========
        const tips = [];
        tips.push(formData.sleep === 'less_5' || formData.sleep === '5_7'
            ? "Set a consistent sleep schedule — same bedtime and wake time, even on weekends."
            : "Maintain your sleep routine and avoid screens 30 minutes before bed.");
        tips.push(formData.exercise === 'never' || formData.exercise === 'sometimes'
            ? "Take a 10-minute walk after each meal — improves blood sugar regulation by 30%."
            : "Include both cardio and strength training in your weekly routine.");
        tips.push(age > 40
            ? "Prioritize calcium and Vitamin D for bone density support."
            : "Build stress-management habits — try 5 min daily meditation.");
        tips.push("Eat colorful vegetables daily — aim for 5+ different colors per week.");

        // ========== SUMMARY ==========
        let summary = `Based on your ${symptoms.length} reported symptom${symptoms.length !== 1 ? 's' : ''} and lifestyle profile, your risk is ${riskLevel} (${riskScore}%). `;
        if (riskLevel === "High") summary += "We strongly recommend a healthcare consultation for diagnostic testing.";
        else if (riskLevel === "Moderate") summary += "Proactive lifestyle changes can significantly reduce your long-term risk.";
        else summary += "Continue your current habits and stay consistent with preventive check-ups.";

        // ========== CATEGORY SCORES ==========
        let cvScore = 5;
        if (symptoms.includes('Chest Pain')) cvScore += 25;
        if (symptoms.includes('Dizziness')) cvScore += 10;
        if (symptoms.includes('Shortness of Breath')) cvScore += 10;
        if (formData.smoking === 'regular') cvScore += 15;
        if (formData.exercise === 'never') cvScore += 10;
        if (bmi > 30) cvScore += 10; else if (bmi > 25) cvScore += 5;
        if (age > 50) cvScore += 8;

        let respScore = 5;
        if (symptoms.includes('Shortness of Breath')) respScore += 25;
        if (symptoms.includes('Persistent Cough')) respScore += 20;
        if (formData.smoking === 'regular') respScore += 20;
        else if (formData.smoking === 'occasional') respScore += 10;

        let metaScore = 5;
        if (symptoms.includes('Frequent Urination')) metaScore += 20;
        if (symptoms.includes('Fatigue')) metaScore += 10;
        if (symptoms.includes('Nausea')) metaScore += 8;
        if (formData.exercise === 'never') metaScore += 10;
        if (bmi > 30) metaScore += 15; else if (bmi > 25) metaScore += 8;
        if (formData.alcohol === 'high') metaScore += 10;

        const getRiskLabel = (s) => s > 40 ? "Elevated" : s > 20 ? "Moderate" : "Low";

        return {
            riskLevel, score: riskScore,
            date: new Date().toLocaleDateString(), userName: currentName,
            summary, recommendations: recommendations.slice(0, 4),
            tips: tips.slice(0, 4),
            details: [
                { category: "Cardiovascular", risk: getRiskLabel(cvScore), score: Math.min(100, cvScore) },
                { category: "Respiratory", risk: getRiskLabel(respScore), score: Math.min(100, respScore) },
                { category: "Metabolic", risk: getRiskLabel(metaScore), score: Math.min(100, metaScore) }
            ],
            source: 'fallback'
        };
    };

    const result = getResultSync();

    const getRiskColor = (level) => {
        switch (level) {
            case "Low": return "text-emerald-500 bg-emerald-50 border-emerald-100";
            case "Moderate": return "text-amber-500 bg-amber-50 border-amber-100";
            case "High": return "text-rose-600 bg-rose-50 border-rose-100";
            default: return "text-slate-600 bg-slate-50 border-slate-100";
        }
    };

    const getRiskIcon = (level) => {
        switch (level) {
            case "Low": return <GenZIcon icon={ShieldCheck} color="text-emerald-500" glowColor="bg-emerald-500/20" />;
            case "Moderate": return <GenZIcon icon={AlertTriangle} color="text-amber-500" glowColor="bg-amber-500/20" />;
            case "High": return <GenZIcon icon={ShieldAlert} color="text-rose-500" glowColor="bg-rose-500/20" />;
            default: return <GenZIcon icon={Info} color="text-slate-500" glowColor="bg-slate-500/20" />;
        }
    };

    const ringColor = result.riskLevel === "Low" ? "stroke-health-green" : result.riskLevel === "Moderate" ? "stroke-amber-500" : "stroke-rose-500";

    const handleDownloadPDF = async () => {
        if (!pdfTemplateRef.current) return;

        setIsGenerating(true);
        try {
            const element = pdfTemplateRef.current;

            const originalStyle = element.style.cssText;
            element.style.position = 'static';
            element.style.left = '0';
            element.style.zIndex = '9999';

            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 800
            });

            element.style.cssText = originalStyle;

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`VitaGuard_Analysis_Report_${result.userName.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate official report. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pt-36 pb-20 px-4 transition-colors duration-300">
            {/* Hidden Medical Template for PDF Generation */}
            <MedicalReportTemplate
                ref={pdfTemplateRef}
                result={result}
                formData={assessmentData.formData || {}}
            />

            <div className="max-w-4xl mx-auto">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-8">
                    <Link to="/dashboard" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </Link>
                    <div className="flex gap-4 items-center">
                        {/* AI Source Badge */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border ${result.source === 'gemini' ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-dark-border/50' : 'bg-slate-50 dark:bg-dark-card text-slate-500 dark:text-slate-400 border-slate-200 dark:border-dark-border'}`}>
                            {result.source === 'gemini' ? <Sparkles size={14} /> : <Cpu size={14} />}
                            {result.source === 'gemini' ? 'Gemini AI' : 'Local Engine'}
                        </div>
                        <button className="p-2 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            <Share2 size={20} />
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="p-2 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                        </button>
                    </div>
                </div>

                <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-0">
                    {/* Main Risk Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-12 bg-white dark:bg-dark-card rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-dark-border overflow-hidden"
                    >
                        <div className="p-8 md:p-12">
                            <div className="flex flex-col md:flex-row items-center gap-12">
                                {/* Visual Score Ring */}
                                <div className="relative flex items-center justify-center">
                                    <svg className="w-48 h-48 -rotate-90">
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                        <motion.circle
                                            cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent"
                                            strokeDasharray={553}
                                            initial={{ strokeDashoffset: 553 }}
                                            animate={{ strokeDashoffset: 553 - (553 * result.score) / 100 }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className={ringColor}
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-4xl font-black text-slate-800 dark:text-white">{result.score}%</span>
                                        <span className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">Severity</span>
                                    </div>
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 ${getRiskColor(result.riskLevel)} dark:bg-opacity-20`}>
                                        {getRiskIcon(result.riskLevel)}
                                        <span className="font-bold text-lg">{result.riskLevel} Risk Level</span>
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Hello {result.userName}, your analysis is complete.</h1>
                                    <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">{result.summary}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-dark-bg/50 py-8 px-8 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-100 dark:border-dark-border">
                            {result.details.map((detail, idx) => (
                                <div key={idx} className="bg-white dark:bg-dark-card p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border">
                                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-tight">{detail.category}</p>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xl font-bold text-slate-800 dark:text-white">{detail.risk}</span>
                                        <span className="text-slate-300 dark:text-slate-500 text-sm font-medium">{detail.score}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${detail.score}%` }}
                                            transition={{ duration: 1, delay: 0.3 + idx * 0.2 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recommendations */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-7 space-y-6"
                    >
                        <div className="bg-white dark:bg-dark-card rounded-[2rem] p-8 shadow-lg border border-slate-100 dark:border-dark-border h-full">
                            <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                                <span className="text-3xl">🛡️</span>
                                Recommended Precautions
                            </h3>
                            <ul className="space-y-6">
                                {result.recommendations.map((rec, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + idx * 0.1 }}
                                        className="flex items-start gap-4"
                                    >
                                        <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full p-1.5 mt-1">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <p className="text-slate-700 font-medium leading-relaxed">{rec}</p>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>

                    {/* Side Info / CTA */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-5 space-y-6"
                    >
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-8 shadow-lg text-white">
                            <h3 className="text-xl font-bold mb-4">Need a detailed consultation?</h3>
                            <p className="text-slate-400 mb-8 font-medium">While our AI system is accurate, it doesn't replace a real doctor's advice. Consult a specialist for a deep dive.</p>
                            <button className="w-full bg-white dark:bg-dark-card text-slate-900 dark:text-white font-bold py-4 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all flex items-center justify-center gap-2 mb-4">
                                Find a Doctor Near Me
                            </button>
                            <button className="w-full bg-slate-700/50 dark:bg-dark-border/50 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 dark:hover:bg-dark-border transition-all border border-slate-700 dark:border-dark-border">
                                Save Result to Profile
                            </button>
                        </div>

                        <div className="bg-white dark:bg-dark-card rounded-[2rem] p-8 border border-slate-100 dark:border-dark-border shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-health-teal/10 p-3 rounded-2xl">
                                    <Info className="text-health-teal" />
                                </div>
                                <h4 className="font-bold text-slate-800">Health Security</h4>
                            </div>
                            <p className="text-sm text-slate-500 italic">This report is generated securely. Your data is encrypted and only accessible by you.</p>
                        </div>
                    </motion.div>

                    {/* ======================== DAILY HEALTH TIPS SECTION ======================== */}
                    {result.tips && result.tips.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="lg:col-span-12"
                        >
                            <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-health-cyber rounded-[2.5rem] p-1 shadow-2xl">
                                <div className="bg-white dark:bg-dark-card rounded-[2.3rem] p-8 md:p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="bg-amber-50 p-3 rounded-2xl">
                                            <Lightbulb className="text-amber-500" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Daily Health Tips</h3>
                                            <p className="text-slate-400 text-sm font-medium">Personalized suggestions to improve your health daily</p>
                                        </div>
                                        {result.source === 'gemini' && (
                                            <div className="ml-auto hidden md:flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-violet-100 dark:border-violet-800/50">
                                                <Sparkles size={12} />
                                                AI Generated
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {result.tips.map((tip, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.7 + idx * 0.1 }}
                                                className="flex items-start gap-4 bg-slate-50 dark:bg-dark-bg/40 p-5 rounded-2xl border border-slate-100 dark:border-dark-border hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-300 group"
                                            >
                                                <div className="bg-gradient-to-br from-primary-500 to-health-cyber text-white rounded-xl p-2.5 mt-0.5 shadow-sm group-hover:scale-110 transition-transform">
                                                    <span className="text-sm font-black">{idx + 1}</span>
                                                </div>
                                                <p className="text-slate-700 font-medium leading-relaxed">{tip}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* AI Health Assistant Chatbot */}
            <HealthChatBot reportData={result} />
        </div>
    );
};

export default ResultsPage;
