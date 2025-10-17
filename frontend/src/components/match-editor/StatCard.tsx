import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'purple';
  subtitle?: string;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  red: 'from-red-500 to-red-600',
  yellow: 'from-yellow-500 to-yellow-600',
  orange: 'from-orange-500 to-orange-600',
  purple: 'from-purple-500 to-purple-600',
};

export function StatCard({
  icon: Icon,
  label,
  value,
  color = 'blue',
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 hover:scale-105 transition-transform">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white text-3xl font-bold">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
