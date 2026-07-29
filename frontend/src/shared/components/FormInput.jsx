import React from 'react';

export default function FormInput({ label, type = 'text', value, onChange, placeholder, required = false, disabled = false, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3.5 py-3 glass-input rounded-xl text-slate-800 text-sm font-semibold ${
          disabled ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}
