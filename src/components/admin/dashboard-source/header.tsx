"use client";

import { useState } from 'react';
import { 
  Search, 
  Clock, 
  Plus, 
  Lightbulb, 
  Filter, 
  Settings, 
  HelpCircle, 
  Headphones,
  X, 
  Info,
  Sparkles
} from "lucide-react";

interface HeaderProps {
  onAddLeadClick?: () => void;
}

export default function Header({ 
  onAddLeadClick
}: HeaderProps) {
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  return (
    <header 
      id="main-app-header"
      className="h-16 px-6 flex items-center justify-between shrink-0 select-none relative"
    >
      {/* Left side remains empty for identical layout balance */}
      <div className="flex-1 flex items-center gap-2">
      </div>

      {/* Action Icons Panel on the Right - matching the reference image exactly */}
      <div className="flex items-center gap-1">
        
        {/* Search Icon */}
        <button
          className="w-9 h-9 rounded-full border border-gray-400/20 flex items-center justify-center hover:bg-white/30 text-gray-500 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none"
          title="Search"
        >
          <Search className="w-5 h-5 stroke-[1.5]" />
        </button>
 
        {/* History / Clock Icon */}
        <button
          className="w-9 h-9 rounded-full border border-gray-400/20 flex items-center justify-center hover:bg-white/30 text-gray-500 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none"
          title="Recent History"
        >
          <Clock className="w-5 h-5 stroke-[1.5]" />
        </button>
 
        {/* Plus / Quick Create Icon */}
        <button
          onClick={onAddLeadClick}
          className="w-9 h-9 rounded-full border border-gray-400/20 flex items-center justify-center hover:bg-white/30 text-gray-500 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none"
          title="Quick Create"
        >
          <Plus className="w-5 h-5 stroke-[1.5]" />
        </button>
 
        {/* Lightbulb / Insights Icon */}
        <button
          className="w-9 h-9 rounded-full border border-gray-400/20 flex items-center justify-center hover:bg-white/30 text-gray-500 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none"
          title="Insights"
        >
          <Lightbulb className="w-5 h-5 stroke-[1.5]" />
        </button>
 
        {/* Filter Button */}
        <button
          className="w-9 h-9 rounded-full border border-gray-400/20 flex items-center justify-center hover:bg-white/30 text-gray-500 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none"
          title="Filters"
        >
          <Filter className="w-5 h-5 stroke-[1.5]" />
        </button>
 
        {/* Settings Button */}
        <button
          onClick={() => {
            setShowSettingsPanel(!showSettingsPanel);
          }}
          className="w-9 h-9 rounded-full border border-gray-400/20 flex items-center justify-center hover:bg-white/30 text-gray-500 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none"
          title="Settings"
        >
          <Settings className="w-5 h-5 stroke-[1.5]" />
        </button>
 
        {/* Help Icon */}
        <button
          className="w-9 h-9 rounded-full border border-gray-400/20 flex items-center justify-center hover:bg-white/30 text-gray-500 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none"
          title="Help"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.5]" />
        </button>
 
        {/* Support / Headphones Icon */}
        <button
          className="w-9 h-9 rounded-full border border-gray-400/20 flex items-center justify-center hover:bg-white/30 text-gray-500 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none"
          title="Support"
        >
          <Headphones className="w-5 h-5 stroke-[1.5]" />
        </button>
 
        {/* User Profile Avatar with Online Dot */}
        <div className="flex items-center pl-1 select-none">
          <div className="relative cursor-pointer group shrink-0">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
              alt="User Profile"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-gray-400/20 group-hover:border-black/50 transition-colors"
            />
            {/* Active online indicator */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
          </div>
        </div>
      </div>

      {/* Settings Customizer Panel */}
      {showSettingsPanel && (
        <div 
          id="settings-panel"
          className="absolute right-12 top-16 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-slide-down"
        >
          <div className="pb-2 mb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-amber-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Design Customizer</h3>
            </div>
            <button 
              onClick={() => setShowSettingsPanel(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-start gap-2 text-xs text-gray-600">
              <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <p>This layout is meticulously crafted to match the custom Dynamics 365 dashboard UI aesthetics.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
