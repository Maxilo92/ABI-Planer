import React, { useState } from 'react';
import { ChevronDown, Calendar, Lock, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const YearSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentYear, availableYears, switchYear } = useAppContext();
  const isDropdownDisabled = availableYears.length <= 1;

  return (
    <div className="relative">
      <button
        onClick={() => !isDropdownDisabled && setIsOpen(!isOpen)}
        disabled={isDropdownDisabled}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
          isDropdownDisabled 
            ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-default' 
            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar className={`w-4 h-4 ${isDropdownDisabled ? 'text-gray-400' : 'text-slate-600'}`} />
          <span>{currentYear.label}</span>
          {currentYear.phase >= 7 && (
            <Lock className="w-3 h-3 text-amber-500" />
          )}
        </div>
        {!isDropdownDisabled && (
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && !isDropdownDisabled && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {availableYears.map((year) => (
              <button
                key={year.id}
                onClick={() => {
                  switchYear(year.id);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                  currentYear.id === year.id ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{year.label}</span>
                  {year.phase >= 7 && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                      Read-Only
                    </span>
                  )}
                </div>
                {currentYear.id === year.id && (
                  <CheckCircle2 className="w-4 h-4 text-slate-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
