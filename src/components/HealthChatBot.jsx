import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, User, Loader2, Sparkles, Search, Cpu, Stethoscope } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const HealthChatBot = ({ reportData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hello ${reportData?.userName || 'User'}! 👋 I've analyzed your health profile. You have a ${reportData?.riskLevel} risk status (${reportData?.score}% severity). How can I assist you with these results today? ✨`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
        setIsLoading(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.length < 10) {
                return generateSmartLocalResponse(userMessage);
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 500,
                }
            });

            const systemContext = `
                You are the VitaGuard Health AI Assistant. You have the user's specific medical report.
                
                USER DATA:
                - Name: ${reportData?.userName}
                - Risk: ${reportData?.riskLevel} (${reportData?.score}%)
                - Summary: ${reportData?.summary}
                - Recommendations: ${reportData?.recommendations?.join(', ')}
                - Diet Options: ${reportData?.dietOptions?.join(', ')}
                - Category Details: ${reportData?.details?.map(d => `${d.category}:${d.risk}`).join(', ')}

                STRICT OPERATIONAL RULES:
                1. NO REPETITION: Do not repeat facts from the report or previous answers. If they ask a follow-up, pivot to NEW insights.
                2. STICK TO THE QUESTION: Give real, logical, medical-based answers. If they ask about food, talk about their specific dietary needs.
                3. CLINICAL DEPTH: Explain the "WHY" behind suggestions using scientific reasoning.
                4. NO FLUFF: Keep it concise and meaningful.
                5. DISCLAIMER: Always end with: "Consult a professional for medical diagnosis. 🏥"
            `;

            const history = messages.map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n');
            const prompt = `${systemContext}\n\nCONVERSATION HISTORY:\n${history}\n\nNEW USER MESSAGE: ${userMessage}\n\nAI RESPONSE:`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: text,
                timestamp: new Date()
            }]);
        } catch (error) {
            console.error("AI Error:", error);
            generateSmartLocalResponse(userMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const generateSmartLocalResponse = (msg) => {
        const query = msg.toLowerCase();
        let response = "";

        if (query.includes('thank') || query.includes('thx')) {
            response = "You're very welcome! I'm here to support your health journey anytime. 😊 Let me know if you have more questions! ✨";
        } else if (query.includes('hi') || query.includes('hello') || query.includes('hey')) {
            response = `Hello there! 👋 I'm ready to help you explore your ${reportData?.riskLevel} risk report. What's on your mind? 🩺`;
        } else if (query.includes('risk') || query.includes('score') || query.includes('percent')) {
            response = `Your severity score is ${reportData?.score}% 📊, which places you in the ${reportData?.riskLevel} category. This is influenced by factors like ${reportData?.formData?.symptoms?.length > 0 ? reportData?.formData?.symptoms?.join(', ') : 'lifestyle habits'}. 🩺`;
        } else if (query.includes('how') || query.includes('what') || query.includes('do') || query.includes('help')) {
            const randomRec = reportData?.recommendations?.[Math.floor(Math.random() * reportData.recommendations.length)];
            response = `To improve your health status, one key focus should be: ${randomRec} 🥗. Your report summary also notes: ${reportData?.summary} ✨.`;
        } else {
            response = `I've analyzed your query! 🔍 Based on your VitaGuard profile, maintaining consistency with your ${reportData?.riskLevel} status precautions is vital. 💪 Is there anything specific from your report you'd like to dive into?`;
        }

        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response + "\n\n(Consult a professional for medical diagnosis. 🏥)",
                timestamp: new Date()
            }]);
            setIsLoading(false);
        }, 1200);
    };

    return (
        <>
            <motion.div
                className="fixed bottom-8 right-8 z-50"
                initial={{ scale: 0, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
            >
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-4 bg-white dark:bg-dark-card p-2 pr-6 rounded-[2.5rem] sticker group border-4 border-slate-900 dark:border-white"
                >
                    <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-health-cyber rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                            <span className="text-3xl">🤖</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-dark-card p-1.5 rounded-full shadow-md border-2 border-slate-900">
                            <span className="text-xs">🩺</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">AI Doctor</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-health-emerald opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-health-emerald"></span>
                            </span>
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live Help</span>
                        </div>
                    </div>
                </button>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, originY: 1, originX: 1 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-24 right-4 w-[95vw] md:w-[360px] h-[550px] max-h-[85vh] bg-white rounded-[2rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.4)] z-[60] flex flex-col overflow-hidden border border-slate-200"
                    >
                        <div className="bg-slate-900 p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <Cpu size={120} />
                            </div>
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Bot className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl tracking-tight uppercase">VitaGuard AI</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-health-emerald rounded-full" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connected to Report Data</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 scrollbar-hide">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'assistant'
                                        ? 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none font-medium max-w-[90%]'
                                        : 'bg-primary-600 text-white shadow-xl rounded-tr-none font-bold max-w-[85%]'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="px-6 py-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-3">
                                        <Loader2 size={18} className="animate-spin text-primary-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">AI is thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-8 bg-white border-t border-slate-50">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type your health query..."
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 pl-6 pr-16 text-sm focus:outline-none focus:border-primary-500 focus:bg-white transition-all font-medium"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-2 bottom-2 px-6 bg-slate-900 text-white rounded-xl hover:bg-black transition-all active:scale-95 disabled:opacity-30"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default HealthChatBot;
