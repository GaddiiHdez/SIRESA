import React from 'react';
import { Check } from 'lucide-react';

export default function HorizontalStepper({ step, activeSteps, stepTitles }) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-200/80 rounded-2xl mb-2 shadow-2xs max-w-full overflow-x-auto select-none shrink-0 scrollbar-none">
      {activeSteps.map((num, idx) => {
        const stepIndex = activeSteps.indexOf(step);
        const isActive = stepIndex >= idx;
        const isCurrent = step === num;

        return (
          <React.Fragment key={num}>
            {idx > 0 && (
              <div className={`h-[2.5px] w-6 md:w-12 rounded-full transition-all duration-300 shrink-0 ${
                isActive ? 'bg-emerald-500' : 'bg-slate-200'
              }`} />
            )}
            <div className="flex items-center gap-2 shrink-0">
              {/* Círculo indicador */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 shrink-0 ${
                  isCurrent
                    ? 'bg-nayarit-gold text-white border-nayarit-gold shadow-md ring-4 ring-nayarit-gold/15'
                    : isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {isActive && !isCurrent ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className={`text-[11.5px] font-black uppercase tracking-wider ${
                isCurrent
                  ? 'text-nayarit-dark'
                  : isActive
                    ? 'text-emerald-700'
                    : 'text-slate-400'
              }`}>
                {stepTitles[num]}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
