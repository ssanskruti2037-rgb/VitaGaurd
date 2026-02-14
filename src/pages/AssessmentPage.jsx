import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, ChevronRight, ChevronLeft, Activity, Info, Loader2 } from 'lucide-react';

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { analyzeHealthWithGemini } from '../services/gemini';
import { useAuth } from '../context/AuthContext';

const AssessmentPage = () => {
    const { currentUser } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: currentUser?.displayName || '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        symptoms: [],
        sleep: '',
        exercise: '',
        smoking: '',
        alcohol: ''
    });

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!currentUser) return;
            try {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData(prev => ({
                        ...prev,
                        name: data.displayName || currentUser.displayName || prev.name,
                        age: data.age || prev.age,
                        gender: data.gender || prev.gender,
                        height: data.height || prev.height,
                        weight: data.weight || prev.weight
                    }));
                }
            } catch (error) {
                console.error("Error fetching profile for pre-fill:", error);
            }
        };

        fetchUserProfile();
    }, [currentUser]);

    const navigate = useNavigate();

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const toggleSymptom = (symptom) => {
        if (formData.symptoms.includes(symptom)) {
            setFormData({ ...formData, symptoms: formData.symptoms.filter(s => s !== symptom) });
        } else {
            setFormData({ ...formData, symptoms: [...formData.symptoms, symptom] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Call Gemini AI for intelligent analysis (no random scores — 100% data-driven)
            const analysisResult = await analyzeHealthWithGemini(formData);
            const finalScore = analysisResult.data.score;

            // 2. Save to Firebase (best effort, non-blocking)
            if (currentUser) {
                addDoc(collection(db, "assessments"), {
                    userId: currentUser.uid,
                    ...formData,
                    riskScore: finalScore,
                    aiSource: analysisResult.source,
                    timestamp: serverTimestamp()
                }).then(() => {
                    console.log("Cloud Save Successful (Background)");
                }).catch((err) => {
                    console.error("Cloud Save Failed (Background):", err);
                });
            }

            // 3. Navigate to results with the full AI analysis
            setLoading(false);
            navigate('/results', {
                state: {
                    score: finalScore,
                    name: formData.name,
                    formData: formData,
                    aiAnalysis: analysisResult
                }
            });
        } catch (error) {
            console.error("Assessment Error:", error);
            setLoading(false);
            // Navigate to results — the ResultsPage will use its local analysis engine
            navigate('/results', {
                state: {
                    score: null,
                    name: formData.name,
                    formData: formData
                }
            });
        }
    };

    const steps = [
        { title: "Personal Details", icon: <Info /> },
        { title: "Symptoms", icon: <Activity /> },
        { title: "Lifestyle", icon: <HeartPulse /> }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-8 overflow-hidden rounded-full bg-primary-100 p-6"
                >
                    <HeartPulse className="text-primary-600 h-16 w-16" />
                </motion.div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Analyzing Your Risks...</h2>
                <p className="text-slate-500 text-center max-w-md">Our AI system is processing your symptoms and lifestyle data to provide precise health insights.</p>
                <div className="mt-12 flex items-center gap-2 text-primary-600 font-bold">
                    <Loader2 className="animate-spin" size={20} />
                    Calculating Analysis...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pt-36 pb-20 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Progress Stepper */}
                <div className="mb-12 flex justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-primary-600 -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {steps.map((s, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${step > idx + 1 ? 'bg-primary-600 text-white' : step === idx + 1 ? 'bg-white border-2 border-primary-600 text-primary-600 shadow-lg scale-110' : 'bg-slate-200 text-slate-400'}`}>
                                {idx + 1}
                            </div>
                            <span className={`mt-2 text-xs font-bold ${step === idx + 1 ? 'text-primary-700' : 'text-slate-400'}`}>{s.title}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 md:p-12">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Tell us about yourself</h2>
                                    <p className="text-slate-500 mb-8">This data helps us calibrate the risk models for your demographic.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Age</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="e.g. 25"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Height (cm)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="175"
                                            value={formData.height}
                                            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Weight (kg)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="70"
                                            value={formData.weight}
                                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <button onClick={handleNext} disabled={!formData.name || !formData.age || !formData.gender} className="w-full btn-primary py-4 disabled:opacity-50 disabled:transform-none">
                                        Continue to Symptoms
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Are you experiencing any of these?</h2>
                                    <p className="text-slate-500 mb-8">Select all that apply. Be as accurate as possible.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {['Chest Pain', 'Shortness of Breath', 'Fatigue', 'Dizziness', 'Persistent Cough', 'Nausea', 'Frequent Urination', 'Headache', 'None of the above'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                if (s === 'None of the above') {
                                                    setFormData({ ...formData, symptoms: ['None of the above'] });
                                                } else {
                                                    const newSymptoms = formData.symptoms.filter(sym => sym !== 'None of the above');
                                                    if (newSymptoms.includes(s)) {
                                                        setFormData({ ...formData, symptoms: newSymptoms.filter(sym => sym !== s) });
                                                    } else {
                                                        setFormData({ ...formData, symptoms: [...newSymptoms, s] });
                                                    }
                                                }
                                            }}
                                            className={`p-4 rounded-2xl text-left border-2 transition-all ${formData.symptoms.includes(s) ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold">{s}</span>
                                                {formData.symptoms.includes(s) && <div className="bg-primary-600 rounded-full p-1"><CheckCircle2 className="text-white h-3 w-3" /></div>}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button onClick={handleBack} className="flex-1 btn-secondary py-4">Back</button>
                                    <button
                                        onClick={handleNext}
                                        disabled={formData.symptoms.length === 0}
                                        className="flex-[2] btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Continue to Lifestyle
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Lifestyle & Habits</h2>
                                    <p className="text-slate-500 mb-8">Almost there! We need a few more details about your daily routine.</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Sleep Duration</label>
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={formData.sleep}
                                            onChange={(e) => setFormData({ ...formData, sleep: e.target.value })}
                                        >
                                            <option value="">Select Option</option>
                                            <option value="less_5">Less than 5 hours</option>
                                            <option value="5_7">5 - 7 hours</option>
                                            <option value="7_9">7 - 9 hours</option>
                                            <option value="9_plus">More than 9 hours</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Exercise Frequency</label>
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={formData.exercise}
                                            onChange={(e) => setFormData({ ...formData, exercise: e.target.value })}
                                        >
                                            <option value="">Select Option</option>
                                            <option value="never">Rarely or Never</option>
                                            <option value="sometimes">1-2 days/week</option>
                                            <option value="regular">3-4 days/week</option>
                                            <option value="daily">Daily</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Smoking Status</label>
                                            <select
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                                value={formData.smoking}
                                                onChange={(e) => setFormData({ ...formData, smoking: e.target.value })}
                                            >
                                                <option value="">Select Option</option>
                                                <option value="non">Non-smoker</option>
                                                <option value="former">Former smoker</option>
                                                <option value="occasional">Occasional</option>
                                                <option value="regular">Regular smoker</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Alcohol Consumption</label>
                                            <select
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                                value={formData.alcohol}
                                                onChange={(e) => setFormData({ ...formData, alcohol: e.target.value })}
                                            >
                                                <option value="">Select Option</option>
                                                <option value="none">None</option>
                                                <option value="low">Occasional / Low</option>
                                                <option value="moderate">Moderate</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button onClick={handleBack} className="flex-1 btn-secondary py-4">Back</button>
                                    <button onClick={handleSubmit} className="flex-[2] btn-primary py-4 flex items-center justify-center gap-2">
                                        Analyze My Risk <ChevronRight size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// Helper for CheckCircle
const CheckCircle2 = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

export default AssessmentPage;
