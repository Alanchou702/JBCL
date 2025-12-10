
import React from 'react';
import { BookOpen, Scale, ScrollText, AlertCircle, CheckCircle2, Siren, Sparkles } from 'lucide-react';

interface RegulationCategory {
  title: string;
  icon: React.ElementType;
  color: string;
  items: RegulationItem[];
}

interface RegulationItem {
  name: string;
  version: string;
  highlight?: boolean;
  description?: string;
}

const REGULATIONS_DB: RegulationCategory[] = [
  {
    title: "医疗/医药专项 (重点监管)",
    icon: Siren,
    color: "text-rose-600 bg-rose-50 border-rose-200",
    items: [
      {
        name: "《医疗广告认定指南》",
        version: "2024-2025 最新适用版",
        highlight: true,
        description: "明确了‘变相发布医疗广告’的认定标准（如健康科普、专家访谈等形式），细化了对医疗技术、诊疗方法宣传的红线。"
      },
      {
        name: "《医疗广告管理办法》",
        version: "2006 (现行有效)",
        description: "规定了医疗广告的发布程序、禁止内容及处罚措施。"
      },
      {
        name: "《药品网络销售监督管理办法》",
        version: "2022.12.01 实施",
        description: "规范药品网络销售及相关广告信息展示。"
      }
    ]
  },
  {
    title: "化妆品分类专项 (新规)",
    icon: Sparkles,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    items: [
      {
        name: "《化妆品监督管理条例》",
        version: "2021.01.01 实施",
        highlight: true,
        description: "核心依据。将化妆品明确分为【特殊化妆品】与【普通化妆品】。"
      },
      {
        name: "特殊化妆品 (5+X 类)",
        version: "合规要点",
        highlight: true,
        description: "仅染发、烫发、祛斑美白、防晒、防脱发及新功效属于特殊类，必须持有【国妆特字】证。"
      },
      {
        name: "普通化妆品 (非特)",
        version: "合规要点",
        description: "除上述5类外的均为普通化妆品。严禁宣传‘美白’、‘祛斑’、‘生发’、‘防晒’等特殊功效。"
      }
    ]
  },
  {
    title: "基础法律法规",
    icon: Scale,
    color: "text-slate-700 bg-slate-50 border-slate-200",
    items: [
      {
        name: "《中华人民共和国广告法》",
        version: "2021 修正版",
        highlight: true,
        description: "广告合规的根本大法，定义了绝对化用语、虚假宣传等核心违规情形。"
      },
      {
        name: "《反不正当竞争法》",
        version: "2019 修正版",
        description: "涉及虚假宣传、混淆行为的法律界定。"
      }
    ]
  },
  {
    title: "互联网广告专项",
    icon: ScrollText,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    items: [
      {
        name: "《互联网广告管理办法》",
        version: "2023.05.01 实施",
        highlight: true,
        description: "明确了‘种草’、直播带货、软文广告的标识义务（必须标明‘广告’）。"
      }
    ]
  }
];

export const RegulationsPanel: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[600px] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                 <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200">
                    <BookOpen className="w-6 h-6 text-white" />
                 </div>
                 法律法规知识库
               </h3>
               <p className="text-slate-500 mt-2 font-medium">
                 AI 智能引擎当前依据的合规校验标准清单
               </p>
            </div>
            
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-100 flex items-center gap-2 text-sm font-bold shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>知识库已同步最新监管要求</span>
            </div>
         </div>
      </div>

      {/* List */}
      <div className="p-8 bg-slate-50/50 flex-1">
        <div className="grid grid-cols-1 gap-8">
            {REGULATIONS_DB.map((category, idx) => {
                const Icon = category.icon;
                return (
                    <div key={idx} className="space-y-4">
                        <h4 className="flex items-center gap-2 font-bold text-lg text-slate-700">
                            <Icon className="w-5 h-5 text-slate-400" />
                            {category.title}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.items.map((item, i) => (
                                <div key={i} className={`relative p-5 rounded-xl border transition-all hover:shadow-md bg-white ${item.highlight ? 'border-indigo-300 shadow-indigo-100/50 ring-1 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                    {item.highlight && (
                                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg rounded-tr-lg font-bold uppercase tracking-wider">
                                            Core Logic
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between mb-2">
                                        <h5 className={`font-bold text-base ${item.highlight ? 'text-indigo-900' : 'text-slate-800'}`}>
                                            {item.name}
                                        </h5>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-mono">
                                            版本: {item.version}
                                        </span>
                                    </div>
                                    {item.description && (
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            {item.description}
                                        </p>
                                    )}
                                    {item.name.includes("医疗广告认定指南") && (
                                        <div className="mt-3 bg-rose-50 border border-rose-100 p-2 rounded text-xs text-rose-700 flex items-start gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span>
                                                <strong>AI 特别校验：</strong>重点查处“健康科普”变相广告。
                                            </span>
                                        </div>
                                    )}
                                    {item.name.includes("化妆品监督管理条例") && (
                                        <div className="mt-3 bg-purple-50 border border-purple-100 p-2 rounded text-xs text-purple-700 flex items-start gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span>
                                                <strong>新增逻辑：</strong>强制校验“普通”与“特殊”化妆品分类及资质。
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};
