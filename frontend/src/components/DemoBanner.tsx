import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export const DemoBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-amber-600/90 to-orange-600/90 backdrop-blur-sm border-b border-amber-500/30">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-100 flex-shrink-0" />
            <div className="text-amber-50">
              <div className="text-sm font-medium">
                🚀 Modo Demonstração Ativo
              </div>
              {isExpanded && (
                <div className="text-xs text-amber-100 mt-1 max-w-2xl">
                  O backend está sendo configurado no Railway/Render. Enquanto isso, você pode explorar todas as funcionalidades do sistema.
                  Os dados são simulados e não são persistidos. O sistema completo estará online em breve!
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-amber-500/20 rounded-full transition-colors"
              title={isExpanded ? "Recolher" : "Mais informações"}
            >
              <InformationCircleIcon className="h-4 w-4 text-amber-100" />
            </button>
            
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-amber-500/20 rounded-full transition-colors"
              title="Fechar banner"
            >
              <XMarkIcon className="h-4 w-4 text-amber-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};