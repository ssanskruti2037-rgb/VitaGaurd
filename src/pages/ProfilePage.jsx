import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Ruler, Weight, Droplets, ShieldCheck, Save, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

const ProfilePage = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const [profile, setProfile] = useState({
        displayName: currentUser?.displayName || '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        bloodGroup: '',
        medicalHistory: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser) return;
            try {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProfile(prev => ({
                        ...prev,
                        ...docSnap.data(),
                        displayName: currentUser.displayName || docSnap.data().displayName || ''
                    }));
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            // 1. Update Firebase Auth Profile (Display Name)
            if (profile.displayName !== currentUser.displayName) {
                await updateProfile(currentUser, {
                    displayName: profile.displayName
                });
            }

            // 2. Update Firestore User Document
            const userRef = doc(db, "users", currentUser.uid);
            await setDoc(userRef, {
                ...profile,
                updatedAt: new Date()
            }, { merge: true });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors mb-2 text-sm font-medium">
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-800">My Health Profile</h1>
                        <p className="text-slate-500 mt-1">Manage your baseline health parameters for accurate AI analysis.</p>
                    </div>
                    <div className="bg-primary-100 p-4 rounded-3xl text-primary-600 hidden md:block">
                        <ShieldCheck size={32} />
                    </div>
                </div>

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-100 border border-green-200 text-green-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3"
                    >
                        <div className="bg-green-500 text-white p-1 rounded-full"><Save size={14} /></div>
                        Profile updated successfully! All future assessments will use these details.
                    </motion.div>
                )}

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">

                        {/* Basic Info Section */}
                        <section className="space-y-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-4">Personal Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <User size={16} className="text-primary-500" /> Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="displayName"
                                        value={profile.displayName}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <Mail size={16} className="text-primary-500" /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={currentUser?.email}
                                        className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3 text-slate-400 cursor-not-allowed font-medium"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <Calendar size={16} className="text-primary-500" /> Age
                                    </label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={profile.age}
                                        onChange={handleChange}
                                        placeholder="e.g. 25"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                                    <select
                                        name="gender"
                                        value={profile.gender}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all font-medium"
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <Droplets size={16} className="text-primary-500" /> Blood Group
                                    </label>
                                    <select
                                        name="bloodGroup"
                                        value={profile.bloodGroup}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all font-medium"
                                    >
                                        <option value="">Unknown</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Physical Stats Section */}
                        <section className="space-y-6 pt-4">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-4">Physical Composition</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <Ruler size={16} className="text-primary-500" /> Height (cm)
                                    </label>
                                    <input
                                        type="number"
                                        name="height"
                                        value={profile.height}
                                        onChange={handleChange}
                                        placeholder="e.g. 175"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <Weight size={16} className="text-primary-500" /> Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        name="weight"
                                        value={profile.weight}
                                        onChange={handleChange}
                                        placeholder="e.g. 70"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Additional Info Section */}
                        <section className="space-y-6 pt-4">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-4">Medical Background</h3>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide opacity-70">Past Medical History</label>
                                <textarea
                                    name="medicalHistory"
                                    value={profile.medicalHistory}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="e.g. Past surgeries, allergies, or long-term conditions (Diabetes, Asthma, etc.)"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all font-medium resize-none"
                                ></textarea>
                            </div>
                        </section>

                        <div className="pt-8">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-lg"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={22} /> Save Health Profile
                                    </>
                                )}
                            </button>
                            <p className="text-center text-slate-400 text-xs mt-4 italic font-medium">
                                * Your data is securely encrypted and never shared with third parties.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
