import React from 'react';

export default function FormSelect({ label, value, onChange, options = [], required = false, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full px-3.5 py-3 glass-input rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:border-nayarit-gold bg-white"
      >
        {options.map((opt) => {
          const isObj = typeof opt === 'object' && opt !== null;
          const val = isObj ? opt.value : opt;
          const labelText = isObj ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {labelText}
            </option>
          );
        })}
      </select>
    </div>
  );
}
