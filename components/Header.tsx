import React from 'react';
import { Scale, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 text-white py-6 shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AdGuardian CN</h1>
            <p className="text-slate-400 text-sm">智能广告合规校验系统</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-300 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span>依据《广告法》及最新监管法规</span>
        </div>
      </div>
    </header>
  );
};