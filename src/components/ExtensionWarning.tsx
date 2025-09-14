import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function ExtensionWarning() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Detectar se há erros de extensão
    const originalError = console.error;
    console.error = (...args) => {
      const errorString = args.join(' ');
      if (errorString.includes('chrome-extension') || errorString.includes('valueAsNumber')) {
        setIsVisible(true);
      }
      originalError(...args);
    };

    // Verificar se há erros no JavaScript
    window.addEventListener('error', (event) => {
      if (event.message.includes('chrome-extension') || event.message.includes('valueAsNumber')) {
        setIsVisible(true);
      }
    });

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Extensão do Chrome Detectada
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Uma extensão do Chrome está causando alguns erros no console. 
                Isso não afeta o funcionamento do sistema Rivalis.
              </p>
              <p className="mt-1 text-xs">
                Para resolver: desative extensões desnecessárias ou use modo anônimo.
              </p>
            </div>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={() => setIsVisible(false)}
                className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}