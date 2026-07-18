"use client";

import { useState } from 'react';
import { 
  Home, 
  History, 
  Pin, 
  Rocket, 
  LayoutGrid, 
  CalendarDays, 
  Building2, 
  Contact, 
  Users, 
  Target, 
  Trophy, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Grid
} from "lucide-react";

interface SidebarProps {
  activeMenuItem: string;
  setActiveMenuItem: (item: string) => void;
}

export default function Sidebar({ activeMenuItem, setActiveMenuItem }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    recent: false,
    pinned: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const menuGroups = [
    {
      title: 'My Work',
      items: [
        { id: 'sales-accelerator', label: 'Sales accelerator', icon: Rocket },
        { id: 'dashboards', label: 'Dashboards', icon: LayoutGrid },
        { id: 'activities', label: 'Activities', icon: CalendarDays },
      ]
    },
    {
      title: 'Customers',
      items: [
        { id: 'accounts', label: 'Accounts', icon: Building2 },
        { id: 'contacts', label: 'Contacts', icon: Contact },
      ]
    },
    {
      title: 'Sales',
      items: [
        { id: 'leads', label: 'Leads', icon: Users },
        { id: 'opportunities', label: 'Opportunities', icon: Target },
      ]
    },
    {
      title: 'Performance',
      items: [
        { id: 'goals', label: 'Goals', icon: Trophy },
        { id: 'forecasts', label: 'Forecasts', icon: TrendingUp },
      ]
    }
  ];

  return (
    <div 
      id="sidebar-container"
      className={`h-screen bg-crm-sidebar flex flex-col select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* 1. Top Header Logo: Waffle + Dynamic 365 | Sales Hub */}
      <div className={`flex items-center border-b border-[#e2e1df]/60 h-16 shrink-0 gap-3 transition-all duration-300 ${
        isCollapsed ? 'px-0 justify-center' : 'px-4'
      }`}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
          <Grid className="w-5 h-5 text-gray-700" />
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-2 whitespace-nowrap animate-fade-in">
            <span className="font-bold text-[#323130] text-sm tracking-tight font-sans">Dynamic 365</span>
            <span className="w-[1px] h-3.5 bg-[#dcdad3]"></span>
            <span className="text-xs text-[#605e5c] font-semibold font-sans">Sales Hub</span>
          </div>
        )}
      </div>

      {/* Navigation Content */}
      <div className={`flex-1 overflow-hidden py-5 space-y-5 transition-all duration-300 ${
        isCollapsed ? 'px-2' : 'px-4'
      }`}>
        
        {/* Main Menu Header with the Collapse Circle Button */}
        <div className={`flex items-center justify-between ${isCollapsed ? 'px-0 justify-center' : 'px-2'}`}>
          {!isCollapsed && (
            <span className="text-xl font-bold text-gray-800 tracking-tight font-sans animate-fade-in">
              Menu
            </span>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 rounded-full border border-gray-400/20 flex items-center justify-center hover:bg-white/30 text-gray-500 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none shrink-0"
            title={isCollapsed ? "Expand menu" : "Collapse menu"}
          >
            {isCollapsed ? (
              <ArrowRightFromLine className="w-4 h-4" />
            ) : (
              <ArrowLeftFromLine className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Basic Nav Group (Home, Recent, Pinned) */}
        <div className="space-y-1">
          {/* Home */}
          <button
            onClick={() => setActiveMenuItem('home')}
            className={`w-full flex items-center gap-3.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 cursor-pointer focus:outline-none ${
              isCollapsed ? 'justify-center px-1' : ''
            } ${
              activeMenuItem === 'home'
                ? 'bg-crm-accent text-black font-bold'
                : 'text-gray-500 hover:bg-white/30 hover:text-black'
            }`}
            title={isCollapsed ? "Home" : undefined}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
              activeMenuItem === 'home' ? 'border-black/15' : 'border-gray-400/20'
            }`}>
              <Home className={`w-4 h-4 ${activeMenuItem === 'home' ? 'text-lime-700 stroke-[2.5]' : 'text-gray-500'}`} />
            </div>
            {!isCollapsed && <span className="truncate">Home</span>}
          </button>

          {/* Recent */}
          <div>
            <button
              onClick={() => toggleSection('recent')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full text-sm font-semibold text-gray-500 hover:bg-white/30 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none ${
                isCollapsed ? 'justify-center px-1' : ''
              }`}
              title={isCollapsed ? "Recent" : undefined}
            >
              <div className="flex items-center gap-3.5 truncate">
                <div className="w-7 h-7 rounded-full border border-gray-400/20 flex items-center justify-center shrink-0">
                  <History className="w-4 h-4 text-gray-500" />
                </div>
                {!isCollapsed && <span className="truncate">Recent</span>}
              </div>
              {!isCollapsed && (
                <div className="pr-1">
                  {expandedSections.recent ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              )}
            </button>
            {!isCollapsed && expandedSections.recent && (
              <div className="pl-12 pr-2 py-1 space-y-1 text-xs text-[#605e5c] ml-2 mt-1 animate-slide-down">
                <div className="py-1 px-2 hover:bg-white/30 rounded-lg cursor-pointer truncate">Gabriela Christiansen</div>
                <div className="py-1 px-2 hover:bg-white/30 rounded-lg cursor-pointer truncate">Halle Griffiths</div>
                <div className="py-1 px-2 hover:bg-white/30 rounded-lg cursor-pointer truncate">Sales accelerator</div>
              </div>
            )}
          </div>

          {/* Pinned */}
          <div>
            <button
              onClick={() => toggleSection('pinned')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full text-sm font-semibold text-gray-500 hover:bg-white/30 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none ${
                isCollapsed ? 'justify-center px-1' : ''
              }`}
              title={isCollapsed ? "Pinned" : undefined}
            >
              <div className="flex items-center gap-3.5 truncate">
                <div className="w-7 h-7 rounded-full border border-gray-400/20 flex items-center justify-center shrink-0">
                  <Pin className="w-4 h-4 text-gray-500" />
                </div>
                {!isCollapsed && <span className="truncate">Pinned</span>}
              </div>
              {!isCollapsed && (
                <div className="pr-1">
                  {expandedSections.pinned ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              )}
            </button>
            {!isCollapsed && expandedSections.pinned && (
              <div className="pl-12 pr-2 py-1 space-y-1 text-xs text-[#605e5c] ml-2 mt-1 animate-slide-down">
                <div className="py-1 px-2 hover:bg-white/30 rounded-lg cursor-pointer truncate flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-lime-700" /> Sales accelerator
                </div>
                <div className="py-1 px-2 hover:bg-white/30 rounded-lg cursor-pointer truncate flex items-center gap-1.5">
                  <Contact className="w-3.5 h-3.5 text-blue-500" /> Contacts
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grouped Nav Items */}
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1.5 pt-1">
            {!isCollapsed && (
              <span className="px-3 text-[12px] font-bold text-gray-900 block mb-1 animate-fade-in">
                {group.title}
              </span>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isSelected = activeMenuItem === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenuItem(item.id)}
                    className={`w-full flex items-center gap-3.5 px-3 py-1.5 rounded-full text-sm transition-colors duration-200 cursor-pointer focus:outline-none ${
                      isCollapsed ? 'justify-center px-1' : ''
                    } ${
                      isSelected
                        ? 'bg-crm-accent text-black font-bold'
                        : 'text-gray-500 hover:bg-white/30 hover:text-black font-semibold'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                      isSelected ? 'border-black/15' : 'border-gray-400/20'
                    }`}>
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-lime-700 stroke-[2.5]' : 'text-gray-500'}`} />
                    </div>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
