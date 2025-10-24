import { useConfirmStore } from '../store/confirmStore';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ConfirmModal() {
  const { isOpen, options, accept, cancel } = useConfirmStore();

  if (!isOpen) return null;

  const toneClasses: Record<string, { iconBg: string; iconColor: string; confirmBtn: string; title: string }> = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
      title: 'text-red-800',
    },
    primary: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
      title: 'text-slate-900',
    },
    warning: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-700',
      confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      title: 'text-slate-900',
    },
  };

  const tone = toneClasses[options.tone] || toneClasses.primary;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={cancel} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white shadow-xl" role="dialog" aria-modal="true">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-full ${tone.iconBg}`}>
                <ExclamationTriangleIcon className={`h-6 w-6 ${tone.iconColor}`} />
              </div>
              <h3 className={`text-lg font-semibold ${tone.title}`}>{options.title}</h3>
            </div>
            <p className="text-slate-600">{options.message}</p>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={cancel}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              {options.cancelText}
            </button>
            <button
              onClick={accept}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold ${tone.confirmBtn}`}
            >
              {options.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
