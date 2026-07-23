import {
  Archive,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Globe2,
  Layers3,
  ListFilter,
  MessageSquare,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { getDefaultModuleItemId, getModuleConfig } from '../data/moduleConfig';

interface ModuleNavPanelProps {
  activeMenuItem: string;
  selectedItemId: string;
  onSelectItem: (id: string) => void;
}

const icons = [
  Layers3,
  CalendarDays,
  ListFilter,
  Settings2,
  FileText,
  BarChart3,
  ShieldCheck,
  Archive,
  CircleDollarSign,
  Globe2,
  MessageSquare,
];

export default function ModuleNavPanel({
  activeMenuItem,
  selectedItemId,
  onSelectItem,
}: ModuleNavPanelProps) {
  const config = getModuleConfig(activeMenuItem);
  if (!config) return null;

  const effectiveSelectedId = selectedItemId || getDefaultModuleItemId(activeMenuItem);

  return (
    <div
      id="module-nav-panel"
      className="w-[340px] bg-crm-panel rounded-[2.5rem] border border-gray-300/40 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-5rem)] shrink-0 select-none"
    >
      <div className="px-5 py-5 border-b border-black/[0.035]">
        <h2 className="text-lg font-black text-gray-950 tracking-tight leading-none">{config.title}</h2>
        <p className="text-[10px] text-gray-400 font-bold mt-1.5 leading-relaxed">{config.subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {config.groups.map((group, groupIndex) => (
          <section key={group.title} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] text-gray-400 font-black tracking-[0.16em] uppercase">
                {group.title}
              </span>
              <span className="text-[9px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">
                {group.items.length}
              </span>
            </div>

            <div className="space-y-2">
              {group.items.map((item, itemIndex) => {
                const Icon = icons[(groupIndex * 4 + itemIndex) % icons.length];
                const active = item.id === effectiveSelectedId;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => onSelectItem(item.id)}
                    className={`w-full rounded-[1.65rem] border p-3.5 text-left flex items-center gap-3 transition-colors duration-150 cursor-pointer group ${
                      active
                        ? 'bg-gradient-to-br from-[#eafda8] to-[#dcfb61] border-black/10 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-[#d2fc5c]/70 hover:bg-[#eafda8]/5'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                        active
                          ? 'bg-black text-[#eafda8] border-black'
                          : 'bg-gray-50 text-gray-500 border-gray-100 group-hover:bg-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[12px] font-black text-gray-950 tracking-tight block">
                        {item.label}
                      </span>
                      <span
                        className={`text-[9.5px] font-semibold block mt-0.5 leading-relaxed ${
                          active ? 'text-gray-700' : 'text-gray-400'
                        }`}
                      >
                        {item.description}
                      </span>
                    </div>

                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 ${
                        active ? 'text-black translate-x-0.5' : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
