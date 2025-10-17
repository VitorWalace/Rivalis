import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface EventButtonProps {
  icon: LucideIcon;
  label: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'purple';
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const colorClasses = {
  blue: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
  green: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
  red: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
  yellow: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700',
  orange: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700',
  purple: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700',
};

const sizeClasses = {
  small: 'px-4 py-2 text-sm',
  medium: 'px-6 py-3 text-base',
  large: 'px-8 py-4 text-lg',
};

export function EventButton({
  icon: Icon,
  label,
  color = 'blue',
  onClick,
  size = 'large',
  disabled = false,
}: EventButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colorClasses[color]}
        ${sizeClasses[size]}
        text-white font-bold rounded-lg shadow-lg
        transition-all duration-200
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        w-full
      `}
    >
      <Icon className="w-6 h-6" />
      <span>{label}</span>
    </motion.button>
  );
}
