// components/ErrorMessage.js
import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const ErrorMessage = ({ message, onRetry }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
    <div className="bg-red-100 rounded-full p-4">
      <FiAlertCircle className="text-red-600 text-3xl" />
    </div>
    <p className="mt-4 text-lg text-gray-700 text-center">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Reintentar
      </button>
    )}
  </div>
);

export default ErrorMessage;