import { motion } from 'framer-motion';

const CartoonIcon = ({ emoji, size = "text-3xl", className = "" }) => {
    return (
        <motion.div
            whileHover={{ rotate: [-5, 5, -5, 5, 0], scale: 1.1 }}
            className={`sticker h-14 w-14 flex-shrink-0 ${className}`}
        >
            <span className={size}>{emoji}</span>
        </motion.div>
    );
};

export default CartoonIcon;
