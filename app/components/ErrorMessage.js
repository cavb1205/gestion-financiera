// components/ErrorMessage.js
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const ErrorMessage = ({ message, onRetry }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
    <div className="glass rounded-[2rem] p-10 max-w-sm w-full text-center">
      <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <FiAlertCircle className="w-7 h-7 text-rose-500" />
      </div>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
        >
          <FiRefreshCw size={14} />
          Reintentar
        </button>
      )}
    </div>
  </div>
);

export default ErrorMessage;
