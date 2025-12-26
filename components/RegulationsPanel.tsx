
import React from 'react';
import { BookOpen, Scale, ScrollText, AlertCircle, CheckCircle2, Siren, Sparkles, Globe2, Pill, ShoppingCart, ShieldAlert } from 'lucide-react';

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
    title: "药品与医疗专项 (前置审查制)",
    icon: Pill,
    color: "text-red-600 bg-red-50 border-red-200",
    items: [
      {
        name: "《广告法》第46条 (广审号要求)",
        version: "强制准入条件",
        highlight: true,
        description: "发布药品、医疗器械等广告，必须在发布前由药监部门审查。未经审查不得发布。"
      },
      {
        name: "《药品管理法》第90条",
        version: "2019 修订版",
        highlight: true,
        description: "发布药品广告须经药监部门批准，并发给药品广告批准文号（广审号）。"
      },
      {
        name: "《药品网络销售监督管理办法》",
        version: "2022 实施",
        description: "药品可在网络销售，但必须具有资质并公示。严禁直播展示处方药。"
      }
    ]
  },
  {
    title: "虚假宣传与产地专项",
    icon: Globe2,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    items: [
      {
        name: "《广告法》第28条 (虚假广告判定)",
        version: "法律核心依据",
        highlight: true,
        description: "明确规定对商品的产地、规格、成分、性能等作虚假宣传，误导消费者的，属于虚假广告。"
      },
      {
        name: "洋品牌伪装 (伪造进口)",
        version: "典型违规情形",
        highlight: true,
        description: "国产商品通过全外文包装、使用虚假外国品牌授权等手段诱导消费者认为是进口货。"
      }
    ]
  },
  {
    title: "医疗/医药禁止内容",
    icon: Siren,
    color: "text-rose-600 bg-rose-50 border-rose-200",
    items: [
      {
        name: "功效与安全性保证",
        version: "绝对禁止项",
        highlight: true,
        description: "严禁含有表示功效、安全性的断言或者保证；严禁说明治愈率或者有效率。"
      },
      {
        name: "代言人禁令",
        version: "《广告法》第16条",
        description: "严禁利用科研单位、学术机构、医疗机构、专家、医生、患者形象作证明。"
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
        description: "广告合规根本大法，定义了绝对化用语、虚假宣传等核心违规情形。"
      }
    ]
  }
];

export const RegulationsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[600px] flex flex-col animate-fade-in h-full">
      {/* Header */}
      <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
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
         <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
           <Scale className="w-6 h-6" />
         </button>
      </div>

      {/* List */}
      <div className="p-8 bg-slate-50/50 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-8">
            {REGULATIONS_DB.map((category, idx) => {
                const Icon = category.icon;
                return (
                    <div key={idx} className="space-y-4">
                        <h4 className="flex items-center gap-2 font-bold text-lg text-slate-700">
                            <Icon className={`w-5 h-5 ${category.color.split(' ')[0]}`} />
                            {category.title}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.items.map((item, i) => (
                                <div key={i} className={`relative p-5 rounded-xl border transition-all hover:shadow-md bg-white ${item.highlight ? 'border-indigo-300 shadow-indigo-100/50 ring-1 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                    {item.highlight && (
                                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg rounded-tr-lg font-bold uppercase tracking-wider">
                                            核心准则
                                        </div>
                                    )}
                                    <h5 className={`font-bold text-base mb-2 ${item.highlight ? 'text-indigo-900' : 'text-slate-800'}`}>
                                        {item.name}
                                    </h5>
                                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-mono block mb-3 w-fit">
                                        版本: {item.version}
                                    </span>
                                    {item.description && (
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            {item.description}
                                        </p>
                                    )}
                                    {item.name.includes("广审号") && (
                                        <div className="mt-3 bg-red-50 border border-red-100 p-2 rounded text-xs text-red-700 flex items-start gap-1.5">
                                            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span>
                                                <strong>雷达重点：</strong>药品广告必须公示“广审号”。无文号即构成擅自发布。
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
