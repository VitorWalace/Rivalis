interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'colored';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 'w-8 h-8', text: 'text-lg' },
  md: { icon: 'w-12 h-12', text: 'text-xl' },
  lg: { icon: 'w-16 h-16', text: 'text-2xl' },
  xl: { icon: 'w-24 h-24', text: 'text-4xl' }
};

export function Logo({ size = 'md', variant = 'colored', showText = true, className = '' }: LogoProps) {
  const sizes = sizeMap[size];
  
  const getColors = () => {
    switch (variant) {
      case 'light':
        return {
          primary: '#ffffff',
          secondary: '#f3f4f6',
          accent: '#e5e7eb',
          text: 'text-white'
        };
      case 'dark':
        return {
          primary: '#1f2937',
          secondary: '#374151',
          accent: '#4b5563',
          text: 'text-gray-900'
        };
      default: // colored
        return {
          primary: '#3b82f6',
          secondary: '#06b6d4',
          accent: '#f59e0b',
          text: 'text-gray-900'
        };
    }
  };

  const colors = getColors();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizes.icon} relative`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill={colors.primary}
            className="drop-shadow-lg"
          />
          
          {/* Inner Circle */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill={colors.secondary}
            opacity="0.9"
          />
          
          {/* Trophy Base */}
          <rect
            x="42"
            y="70"
            width="16"
            height="8"
            rx="2"
            fill={colors.accent}
          />
          
          {/* Trophy Stem */}
          <rect
            x="47"
            y="62"
            width="6"
            height="12"
            fill={colors.accent}
          />
          
          {/* Trophy Cup */}
          <path
            d="M35 30 C35 25, 40 20, 50 20 C60 20, 65 25, 65 30 L65 45 C65 55, 60 62, 50 62 C40 62, 35 55, 35 45 Z"
            fill={colors.accent}
            className="drop-shadow-sm"
          />
          
          {/* Trophy Handles */}
          <path
            d="M30 35 C25 35, 20 40, 20 45 C20 50, 25 55, 30 55"
            stroke={colors.accent}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M70 35 C75 35, 80 40, 80 45 C80 50, 75 55, 70 55"
            stroke={colors.accent}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Star on Cup */}
          <path
            d="M50 30 L52 36 L58 36 L53 40 L55 46 L50 42 L45 46 L47 40 L42 36 L48 36 Z"
            fill={variant === 'colored' ? '#ffffff' : colors.primary}
            className="drop-shadow-sm"
          />
          
          {/* Shine Effect */}
          <ellipse
            cx="42"
            cy="32"
            rx="4"
            ry="8"
            fill="rgba(255,255,255,0.3)"
            className="opacity-60"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight ${sizes.text} ${colors.text} leading-none`}>
            Rivalis
          </span>
          {size === 'xl' && (
            <span className={`text-sm ${variant === 'light' ? 'text-white/70' : 'text-gray-500'} font-medium tracking-wide`}>
              Championship Manager
            </span>
          )}
        </div>
      )}
    </div>
  );
}