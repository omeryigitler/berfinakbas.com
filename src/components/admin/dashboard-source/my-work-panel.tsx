"use client";

import { useState } from 'react';
import { RotateCw, ClipboardList, Search, User, Phone, Mail, X } from "lucide-react";

interface MyWorkPanelProps {
  selectedLeadId: string;
  onSelectLead: (id: string) => void;
}

interface WorkItem {
  id: string;
  name: string;
  avatar: string;
  role: string;
  score: number;
  date: string;
  type: 'mail' | 'phone';
  category: 'Lead' | 'Opportunity';
  scoreBg: string;
  scoreText: string;
  badgeBorder: string;
}

const WORK_ITEMS: WorkItem[] = [
  {
    id: 'gabriela',
    name: 'Gabriela Christiansen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    role: 'First customer call',
    score: 90,
    date: '8/24/2023, 7:24 am',
    type: 'mail',
    category: 'Lead',
    scoreBg: 'bg-black',
    scoreText: 'text-white',
    badgeBorder: 'border-white/40'
  },
  {
    id: 'halle',
    name: 'Halle Griffiths',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    role: 'Follow up mail',
    score: 83,
    date: '8/24/2023, 7:24 am',
    type: 'phone',
    category: 'Lead',
    scoreBg: 'bg-[#ecfdf5]',
    scoreText: 'text-emerald-600',
    badgeBorder: 'border-emerald-100'
  },
  {
    id: 'josiah',
    name: 'Josiah Love',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'First customer call',
    score: 72,
    date: '8/24/2023, 7:24 am',
    type: 'phone',
    category: 'Lead',
    scoreBg: 'bg-[#fffbeb]',
    scoreText: 'text-amber-600',
    badgeBorder: 'border-amber-100'
  },
  {
    id: 'wyatt',
    name: 'Wyatt Wetmore',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    role: 'Follow up mail',
    score: 32,
    date: '8/24/2023, 7:24 am',
    type: 'mail',
    category: 'Lead',
    scoreBg: 'bg-[#fdf2f2]',
    scoreText: 'text-rose-600',
    badgeBorder: 'border-rose-100'
  }
];

export default function MyWorkPanel({ selectedLeadId, onSelectLead }: MyWorkPanelProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items based on search query
  const filteredItems = WORK_ITEMS.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      id="my-work-panel"
      className="w-[340px] bg-crm-panel rounded-[2.5rem] border border-gray-300/40 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-5rem)] shrink-0 select-none"
    >
      {/* Panel Header */}
      <div className="p-6 pb-3 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">My Work</h2>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button 
            className="w-8 h-8 rounded-full border border-gray-400/20 bg-white/40 flex items-center justify-center hover:bg-gray-100 text-gray-500 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none"
            title="Refresh"
            onClick={() => setSearchQuery('')}
          >
            <RotateCw className="w-4 h-4 stroke-[1.8]" />
          </button>
          <button 
            className="w-8 h-8 rounded-full border border-gray-400/20 bg-white/40 flex items-center justify-center hover:bg-gray-100 text-gray-500 hover:text-black transition-colors duration-200 cursor-pointer focus:outline-none"
            title="Queue"
          >
            <ClipboardList className="w-4 h-4 stroke-[1.8]" />
          </button>
          <button 
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-200 cursor-pointer focus:outline-none ${
              showSearch 
                ? 'bg-black border-black text-white' 
                : 'border-gray-400/20 bg-white/40 text-gray-500 hover:bg-gray-100 hover:text-black'
            }`}
            title="Search My Work"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery('');
            }}
          >
            <Search className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {showSearch && (
        <div className="px-6 pb-3 animate-fade-in">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search leads by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/60 border border-gray-300/60 rounded-xl py-1.5 pl-9 pr-8 text-xs text-gray-950 placeholder-gray-400 focus:outline-none focus:border-black/50 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 hover:text-black text-gray-400 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Date Subheader */}
      <div className="px-6 pb-3">
        <div className="flex items-center justify-center gap-2">
          <div className="flex-1 h-[1px] bg-gray-200/60"></div>
          <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
            {searchQuery ? 'Search Results' : 'Today'}
          </span>
          <div className="flex-1 h-[1px] bg-gray-200/60"></div>
        </div>
      </div>

      {/* Cards List Container */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 px-4">
            <span className="text-xs text-gray-400 font-semibold block">No results found for "{searchQuery}"</span>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-2 text-[10px] font-bold text-gray-600 hover:text-black underline uppercase tracking-wider"
            >
              Clear Search
            </button>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isActive = selectedLeadId === item.id;
            
            return (
              <div key={item.id} className="flex flex-col gap-1.5">
                {/* Conditional timeline separator if index is 3 (Wyatt Wetmore is older) and we are not searching */}
                {!searchQuery && idx === 3 && (
                  <div className="pt-2 pb-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex-1 h-[1px] bg-gray-200/60"></div>
                      <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">3 Weeks Ago</span>
                      <div className="flex-1 h-[1px] bg-gray-200/60"></div>
                    </div>
                  </div>
                )}

                <div 
                  onClick={() => onSelectLead(item.id)}
                  className={`transition-all duration-200 rounded-[2rem] p-4 flex flex-col gap-3 cursor-pointer shadow-xs border ${
                    isActive 
                      ? 'bg-[#eafda8] border-black/[0.04]' 
                      : 'bg-white hover:bg-gray-50/50 border-gray-200/60'
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={item.avatar} 
                        alt={item.name} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-black/5"
                      />
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold leading-tight ${isActive ? 'text-gray-900' : 'text-gray-800'}`}>
                          {item.name}
                        </span>
                        <span className={`text-[10px] ${isActive ? 'text-black/60' : 'text-gray-400'} font-semibold`}>
                          {item.role}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Icon on Right */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs border transition-colors ${
                      isActive 
                        ? 'bg-white/60 text-black/60 border-white/40' 
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}>
                      {item.type === 'mail' ? (
                        <Mail className="w-3.5 h-3.5 stroke-[1.8]" />
                      ) : (
                        <Phone className="w-3.5 h-3.5 stroke-[1.8]" />
                      )}
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between">
                    {/* Category Pill */}
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider ${
                      isActive 
                        ? 'bg-white/40 text-black/50' 
                        : 'bg-gray-50 text-gray-400 border border-gray-100'
                    }`}>
                      {item.category.toUpperCase()}
                    </div>
                    
                    {/* Score badge */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-xs border ${item.scoreBg} ${item.scoreText} ${item.badgeBorder}`}>
                      {item.score}
                    </div>
                  </div>
                </div>

                {/* External Card Metadata */}
                <div className="flex justify-between px-4 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>{item.category}</span>
                  <span>{item.date}</span>
                </div>
              </div>
            );
          })
        )}

      </div>
    </div>
  );
}
