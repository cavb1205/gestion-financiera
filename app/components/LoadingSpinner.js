// components/LoadingSpinner.js
import React from 'react';
import { FiLoader, FiActivity } from 'react-icons/fi';

const LoadingSpinner = () => (
  <div className="min-h-[400px] w-full flex flex-col items-center justify-center bg-transparent animate-in fade-in duration-500">
    <div className="relative flex items-center justify-center">
      {/* Outer Pulse */}
      <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-400/10 rounded-full blur-2xl animate-pulse scale-110"></div>
      
      {/* Spinning Outer Ring */}
      <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-indigo-500 dark:border-t-indigo-400 animate-spin"></div>
      
      {/* Inner Icon */}
      <div className="absolute flex items-center justify-center text-indigo-500 dark:text-indigo-400">
        <FiActivity size={20} className="animate-pulse" />
      </div>
    </div>
    
    <div className="mt-8 text-center">
      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] animate-pulse">
        Sincronizando
      </h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
        Preparando su ecosistema financiero
      </p>
    </div>
  </div>
);

export default LoadingSpinner;