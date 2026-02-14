import { motion } from 'framer-motion';

const GenZIcon = ({ icon: Icon, color = "text-primary-500", glowColor = "bg-primary-500/20", className = "" }) => {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`sticker p-4 group ${className}`}
        >
            <div className={`absolute inset-0 ${glowColor} opacity-0 group-hover:opacity-100 blur-xl transition-opacity rounded-2xl`}></div>
            <Icon className={`relative z-10 transition-colors duration-300 ${color}`} size={24} strokeWidth={2.5} />
        </motion.div>
    );
};

export default GenZIcon;
