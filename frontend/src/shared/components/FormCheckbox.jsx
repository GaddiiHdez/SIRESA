import React from 'react';

export default function FormCheckbox({ label, checked, onChange, className = '' }) {
  return (
    <label className={`flex items-center gap-2.5 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-semibold select-none ${className}`}>
      <input
        type="checkbox"
        checked={checked || false}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 accent-nayarit-gold"
      />
      {label}
    </label>
  );
}
