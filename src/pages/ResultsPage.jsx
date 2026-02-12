import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft, Download, Share2, Info, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import MedicalReportTemplate from '../components/MedicalReportTemplate';

const ResultsPage = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const assessmentData = location.state || {};
    const reportRef = useRef(null);
    const pdfTemplateRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Determine risk level based on score
    const getRiskLevel = (score) => {
        if (score < 15) return "Low";
        if (score < 30) return "Moderate";
        return "High";
    };

    const currentScore = assessmentData.score || 18;
    const currentName = assessmentData.name || currentUser?.displayName || "User";

    // Dummy data
    const result = {
        riskLevel: getRiskLevel(currentScore),
        score: currentScore,
        date: new Date().toLocaleDateString(),
        userName: currentName,
        summary: "Based on your reported symptoms and lifestyle, your current health risk profile is Low. However, persistent symptoms should always be evaluated by a healthcare professional.",
        recommendations: [
            "Maintain your regular exercise routine (3-4 times/week).",
            "Improve sleep consistency to further reduce metabolic risks.",
            "Consider a routine annual physical checkup.",
            "Monitor your caffeine intake during afternoon hours."
        ],
        details: [
            { category: "Cardiovascular", risk: "Very Low", score: 10 },
            { category: "Respiratory", risk: "Low", score: 15 },
            { category: "Metabolic", risk: "Moderate", score: 25 }
        ]
    };

    const getRiskColor = (level) => {
        switch (level) {
            case "Low": return "text-health-green bg-green-50 border-green-100";
            case "Moderate": return "text-amber-600 bg-amber-50 border-amber-100";
            case "High": return "text-rose-600 bg-rose-50 border-rose-100";
            default: return "text-slate-600 bg-slate-50 border-slate-100";
        }
    };

    const getRiskIcon = (level) => {
        switch (level) {
            case "Low": return <CheckCircle2 className="h-12 w-12 text-health-green" />;
            case "Moderate": return <AlertTriangle className="h-12 w-12 text-amber-500" />;
            case "High": return <ShieldAlert className="h-12 w-12 text-rose-500" />;
            default: return <Info className="h-12 w-12 text-slate-400" />;
        }
    };

    const ringColor = result.riskLevel === "Low" ? "stroke-health-green" : result.riskLevel === "Moderate" ? "stroke-amber-500" : "stroke-rose-500";

    const handleDownloadPDF = async () => {
        if (!pdfTemplateRef.current) return;

        setIsGenerating(true);
        try {
            const element = pdfTemplateRef.current;

            // Show temporarily for capture (reset hidden styles)
            const originalStyle = element.style.cssText;
            element.style.position = 'static';
            element.style.left = '0';
            element.style.zIndex = '9999';

            const canvas = await html2canvas(element, {
                scale: 3, // Very high quality for print
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 800
            });

            // Re-hide the template
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
        <div className="bg-slate-50 min-h-screen pt-24 pb-20 px-4">
            {/* Hidden Medical Template for PDF Generation */}
            <MedicalReportTemplate
                ref={pdfTemplateRef}
                result={result}
                formData={assessmentData.formData || {}}
            />

            <div className="max-w-4xl mx-auto">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-8">
                    <Link to="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-primary-600 font-medium transition-colors">
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </Link>
                    <div className="flex gap-4">
                        <button className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-primary-600 transition-colors">
                            <Share2 size={20} />
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-primary-600 transition-colors disabled:opacity-50"
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
                        className="lg:col-span-12 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden"
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
                                        <span className="text-4xl font-black text-slate-800">{result.score}%</span>
                                        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Severity</span>
                                    </div>
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 ${getRiskColor(result.riskLevel)}`}>
                                        {getRiskIcon(result.riskLevel)}
                                        <span className="font-bold text-lg">{result.riskLevel} Risk Level</span>
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-800 mb-4">Hello {result.userName}, your analysis is complete.</h1>
                                    <p className="text-slate-600 text-lg leading-relaxed">{result.summary}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 py-8 px-8 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-100">
                            {result.details.map((detail, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                                    <p className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-tight">{detail.category}</p>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xl font-bold text-slate-800">{detail.risk}</span>
                                        <span className="text-slate-300 text-sm font-medium">{detail.score}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <div className={`h-full bg-primary-500 rounded-full`} style={{ width: `${detail.score}%` }}></div>
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
                        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100 h-full">
                            <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                                <ShieldAlert className="text-primary-600" />
                                Recommended Precautions
                            </h3>
                            <ul className="space-y-6">
                                {result.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-4">
                                        <div className="bg-primary-50 text-primary-600 rounded-full p-1.5 mt-1">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <p className="text-slate-700 font-medium leading-relaxed">{rec}</p>
                                    </li>
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
                            <button className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl hover:bg-primary-50 transition-all flex items-center justify-center gap-2 mb-4">
                                Find a Doctor Near Me
                            </button>
                            <button className="w-full bg-slate-700/50 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 transition-all border border-slate-700">
                                Save Result to Profile
                            </button>
                        </div>

                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-health-teal/10 p-3 rounded-2xl">
                                    <Info className="text-health-teal" />
                                </div>
                                <h4 className="font-bold text-slate-800">Health Security</h4>
                            </div>
                            <p className="text-sm text-slate-500 italic">This report is generated securely. Your data is encrypted and only accessible by you.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;
