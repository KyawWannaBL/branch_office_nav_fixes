import React, { useState, useEffect } from 'react';
import { Edit3, CheckCircle, Settings, ChevronDown } from 'lucide-react';

interface PriceCardProps {
  label: string;
  autoValue: number;
  onFinalValueChange?: (val: number) => void;
}

export const PriceMetricCard: React.FC<PriceCardProps> = ({ label, autoValue, onFinalValueChange }) => {
  const [value, setValue] = useState(autoValue);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'auto' | 'approved' | 'adjusted'>('auto');

  useEffect(() => {
    if (status === 'auto') setValue(autoValue);
  }, [autoValue, status]);

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Number(e.target.value);
    setValue(newVal);
    setStatus('adjusted');
    if (onFinalValueChange) onFinalValueChange(newVal);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md group">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</h4>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-300 hover:text-blue-600 transition-all"
          >
            <Edit3 size={14} />
          </button>
          
          <div className="relative inline-block">
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className={`appearance-none text-[9px] font-bold pl-2 pr-6 py-1 rounded-md border-none ring-1 ring-inset cursor-pointer outline-none
                ${status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 
                  status === 'adjusted' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-50 text-slate-500 ring-slate-200'}`}
            >
              <option value="auto">SYSTEM</option>
              <option value="approved">APPROVE</option>
              <option value="adjusted">MANUAL</option>
            </select>
            <ChevronDown size={10} className="absolute right-2 top-2 pointer-events-none text-slate-400" />
          </div>
        </div>
      </div>

      <div className="flex items-baseline">
        {isEditing ? (
          <input 
            type="number" 
            autoFocus
            className="text-2xl font-bold text-slate-800 border-b-2 border-blue-500 w-full bg-transparent focus:outline-none"
            value={value}
            onChange={handleManualChange}
            onBlur={() => setIsEditing(false)}
          />
        ) : (
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {value.toLocaleString()} <span className="text-sm font-medium text-slate-400 ml-1">MMK</span>
          </span>
        )}
      </div>
    </div>
  );
};
