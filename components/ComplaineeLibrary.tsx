
import React, { useState, useMemo } from 'react';
import { Complainee } from '../types';
import { ShieldAlert, Trash2, Plus, Search, X, Briefcase, Calendar, AlertCircle } from 'lucide-react';

interface ComplaineeLibraryProps {
  library: Complainee[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export const ComplaineeLibrary: React.FC<ComplaineeLibraryProps> = ({ library, onAdd, onRemove, onClose }) => {
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const isDuplicate = useMemo(() => {
    const trimmed = newName.trim().toLowerCase();
    if (!trimmed) return false;
    return library.some(c => c.name.toLowerCase() === trimmed);
  }, [newName, library]);

  const filtered = library.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.addedAt - a.addedAt);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (isDuplicate) {
      alert('该单位名称已在库中，请勿重复录入');
      return;
    }
    onAdd(trimmed);
    setNewName('');
  };

  return (
    <div className="bg-slate-900 flex flex-col h-full animate-in slide-in-from-right duration-300 border-l border-slate-800">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-rose-600/20 p-2 rounded-lg border border-rose-500/30">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">已投诉对象数据库</h3>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">Reported Entity Repository (Locked)</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Add Form */}
      <div className="p-4 bg-slate-950/50 border-b border-slate-800 space-y-2">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="录入新投诉主体名称..."
            className={`flex-1 bg-slate-900 border ${isDuplicate ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-slate-700'} rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-rose-500 outline-none transition-all`}
          />
          <button 
            type="submit"
            disabled={isDuplicate || !newName.trim()}
            className={`p-2 rounded-lg transition-all ${isDuplicate || !newName.trim() ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
        {isDuplicate && (
          <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-bold px-1 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            <span>检测到重复：该对象已存在于库中</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="p-4 relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索库内主体..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-[10px] text-slate-400 focus:border-slate-600 outline-none"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-2">
        {filtered.length === 0 ? (
          <div className="py-20 text-center opacity-30">
            <Briefcase className="w-10 h-10 mx-auto mb-4 text-slate-600" />
            <p className="text-xs font-black uppercase tracking-widest">库内暂无记录</p>
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between group hover:border-rose-500/30 transition-all">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-200 truncate pr-4">{item.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  <span className="text-[9px] text-slate-600 font-mono">
                    录入于: {new Date(item.addedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => onRemove(item.id)}
                className="p-2 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Stat */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 text-[9px] text-slate-600 font-black uppercase tracking-widest text-center">
        当前库内受控主体: {library.length} 位
      </div>
    </div>
  );
};
