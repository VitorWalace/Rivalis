import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function ExtensionWarning() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let triggered = false;
    let isMounted = true;
    const guardSetVisible = () => {
      if (!isMounted || triggered) return;
      triggered = true;
      setIsVisible(true);
    };

    const handleWindowError = (event: ErrorEvent) => {
      const targetMessage = event.message || '';
      if (targetMessage.includes('chrome-extension') || targetMessage.includes('valueAsNumber')) {
        guardSetVisible();
      }
    };

    window.addEventListener('error', handleWindowError);

    return () => {
      isMounted = false;
      window.removeEventListener('error', handleWindowError);
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