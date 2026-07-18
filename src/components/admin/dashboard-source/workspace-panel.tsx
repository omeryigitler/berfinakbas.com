"use client";

import { 
  Save, Plus, Trash2, RotateCw, Key, FileText, Award, GitBranch, MoreHorizontal,
  Mail, Phone, ShieldCheck, ChevronRight, Search, SlidersHorizontal, PlusCircle,
  HelpCircle, Check, Lock, Star, Sparkles, Building2, User2, RefreshCw
} from "lucide-react";

interface ContactInfo {
  topic: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  businessPhone: string;
  mobilePhone: string;
  email: string;
  companyName: string;
  website: string;
}

interface LeadData {
  id: string;
  name: string;
  avatar: string;
  role: string;
  leadSource: string;
  rating: string;
  status: string;
  owner: string;
  ownerAvatar: string;
  score: number;
  grade: string;
  scoreTrend: string;
  scoreInsights: string[];
  contact: ContactInfo;
}

const LEADS_DATABASE: Record<string, LeadData> = {
  gabriela: {
    id: 'gabriela',
    name: 'Gabriela Christiansen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    role: 'First customer call',
    leadSource: 'Webinar',
    rating: 'Warm',
    status: 'New',
    owner: 'Kenny Smith',
    ownerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    score: 90,
    grade: 'Grade A',
    scoreTrend: 'Steady',
    scoreInsights: [
      'Purchase timeframe is next quarter',
      'Purchase process is individual',
      'Lead is relatively new',
      'Estimated budget is $50,000.00'
    ],
    contact: {
      topic: '5 Cafe Grande Espresso Machines',
      firstName: 'Gabriela',
      lastName: 'Christiansen',
      jobTitle: 'Purchasing Manager',
      businessPhone: '930-555-0168',
      mobilePhone: '930-555-0149',
      email: 'gabriela@consolidatedcoffee.com',
      companyName: 'Consolidated Coffee',
      website: 'www.consolidatedcoffee.com'
    }
  },
  halle: {
    id: 'halle',
    name: 'Halle Griffiths',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    role: 'Follow up mail',
    leadSource: 'Referral',
    rating: 'Warm',
    status: 'New',
    owner: 'Kenny Smith',
    ownerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    score: 83,
    grade: 'Grade A',
    scoreTrend: 'Improving',
    scoreInsights: [
      'Responded to introducing email',
      'High web engagement',
      'Budget is being approved',
      'Decision-maker confirmed'
    ],
    contact: {
      topic: 'Premium Coffee Bean Contract',
      firstName: 'Halle',
      lastName: 'Griffiths',
      jobTitle: 'Procurement Specialist',
      businessPhone: '930-555-0422',
      mobilePhone: '930-555-0899',
      email: 'h.griffiths@greenfieldscoffee.com',
      companyName: 'Greenfields Coffee Group',
      website: 'www.greenfieldscoffee.com'
    }
  },
  josiah: {
    id: 'josiah',
    name: 'Josiah Love',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'First customer call',
    leadSource: 'Organic Search',
    rating: 'Hot',
    status: 'In Progress',
    owner: 'Kenny Smith',
    ownerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    score: 72,
    grade: 'Grade B',
    scoreTrend: 'Steady',
    scoreInsights: [
      'Immediate requirement declared',
      'Timeline is within 1 month',
      'Budget is not yet finalized',
      'Requested pricing quotation'
    ],
    contact: {
      topic: 'Barista Station Bundle Upgrade',
      firstName: 'Josiah',
      lastName: 'Love',
      jobTitle: 'Operations Director',
      businessPhone: '930-555-0311',
      mobilePhone: '930-555-0723',
      email: 'josiah.love@urbanbrews.co',
      companyName: 'Urban Brews Co.',
      website: 'www.urbanbrews.co'
    }
  },
  wyatt: {
    id: 'wyatt',
    name: 'Wyatt Wetmore',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    role: 'Follow up mail',
    leadSource: 'Partner',
    rating: 'Cold',
    status: 'New',
    owner: 'Kenny Smith',
    ownerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    score: 32,
    grade: 'Grade C',
    scoreTrend: 'Decreasing',
    scoreInsights: [
      'Low responsive score',
      'No budget allocated yet',
      'Competitor solution in place',
      'Keep nurtured for future quarters'
    ],
    contact: {
      topic: '3 Drip Brewer Installations',
      firstName: 'Wyatt',
      lastName: 'Wetmore',
      jobTitle: 'Office Manager',
      businessPhone: '930-555-0955',
      mobilePhone: '930-555-0487',
      email: 'wyatt@wetmoreconsulting.com',
      companyName: 'Wetmore Consulting',
      website: 'www.wetmoreconsulting.com'
    }
  }
};

interface WorkspacePanelProps {
  selectedLeadId: string;
}

export default function WorkspacePanel({ selectedLeadId }: WorkspacePanelProps) {
  const lead = LEADS_DATABASE[selectedLeadId] || LEADS_DATABASE.gabriela;

  return (
    <div 
      id="workspace-panel"
      className="flex-1 bg-gradient-to-br from-[#eafda8]/75 via-white/80 to-white/95 rounded-[2.5rem] border border-gray-300/40 p-5 flex flex-col h-[calc(100vh-5rem)] shadow-sm overflow-y-auto select-none gap-5 transition-all duration-300"
    >
      {/* 1. TOP TOOLBAR BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.04] pb-4">
        <div className="flex items-center gap-1">
          {/* Save Button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-black/[0.03] text-gray-700 hover:text-black transition-colors text-xs font-semibold focus:outline-none">
            <Save className="w-3.5 h-3.5 text-gray-500" />
            <span>Save</span>
          </button>
          
          {/* New Button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-black/[0.03] text-gray-700 hover:text-black transition-colors text-xs font-semibold focus:outline-none">
            <Plus className="w-3.5 h-3.5 text-gray-500" />
            <span>New</span>
          </button>

          {/* Delete Button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-black/[0.03] text-gray-700 hover:text-black transition-colors text-xs font-semibold focus:outline-none">
            <Trash2 className="w-3.5 h-3.5 text-gray-500" />
            <span>Delete</span>
          </button>

          {/* Refresh Button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-black/[0.03] text-gray-700 hover:text-black transition-colors text-xs font-semibold focus:outline-none">
            <RotateCw className="w-3.5 h-3.5 text-gray-500" />
            <span>Refresh</span>
          </button>

          {/* Check Access Button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-black/[0.03] text-gray-700 hover:text-black transition-colors text-xs font-semibold focus:outline-none">
            <Key className="w-3.5 h-3.5 text-gray-500" />
            <span>Check Access</span>
          </button>

          {/* To PDF */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-black/[0.03] text-gray-700 hover:text-black transition-colors text-xs font-semibold focus:outline-none">
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            <span>To PDF</span>
          </button>

          {/* Quality */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-black/[0.03] text-gray-700 hover:text-black transition-colors text-xs font-semibold focus:outline-none">
            <Award className="w-3.5 h-3.5 text-gray-500" />
            <span>Quality</span>
          </button>

          {/* Process */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-black/[0.03] text-gray-700 hover:text-black transition-colors text-xs font-semibold focus:outline-none">
            <GitBranch className="w-3.5 h-3.5 text-gray-500" />
            <span>Process</span>
          </button>
        </div>

        {/* More Actions */}
        <button className="w-8 h-8 rounded-full hover:bg-black/[0.03] flex items-center justify-center text-gray-500 hover:text-black focus:outline-none">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 2. LEAD HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 p-4 rounded-3xl border border-white/60 shadow-xs">
        {/* Left: Avatar + Name + Badges */}
        <div className="flex items-center gap-3.5">
          <img 
            src={lead.avatar} 
            alt={lead.name}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0" 
          />
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{lead.name}</h1>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 bg-[#eafda8] text-black text-[9px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                Lead
              </span>
              <span className="px-2.5 py-0.5 bg-black text-white text-[9px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-xs">
                <Sparkles className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
                Sales Insight
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Stats Fields */}
        <div className="flex items-center gap-6 text-[11px] font-medium text-gray-500 pr-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Lead Source</span>
            <span className="text-gray-900 font-bold">{lead.leadSource}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Rating</span>
            <span className="text-gray-900 font-bold">{lead.rating}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Status</span>
            <span className="text-gray-900 font-bold">{lead.status}</span>
          </div>
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Owner</span>
              <span className="text-gray-900 font-bold">{lead.owner}</span>
            </div>
            <img 
              src={lead.ownerAvatar} 
              alt={lead.owner}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-white shadow-xs" 
            />
          </div>
        </div>
      </div>

      {/* 3. PROCESS TRACKER (dynamics 365 style) */}
      <div className="bg-white/40 border border-white/60 rounded-3xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Left active process flag */}
        <div className="flex flex-col gap-0.5 pl-2.5">
          <span className="text-xs font-bold text-gray-900 leading-tight">Opportunity Sales Process</span>
          <span className="text-[10px] text-gray-400 font-semibold">Active for 3 Days</span>
        </div>

        {/* Dynamic Chevron list */}
        <div className="flex flex-1 items-center justify-end gap-1 text-[11px] font-bold">
          {/* Step 1: Qualify */}
          <div className="flex items-center bg-teal-500 text-white pl-4 pr-3 py-1.5 rounded-l-full rounded-r-lg relative gap-1.5 shadow-sm">
            <div className="w-4 h-4 rounded-full bg-white text-teal-600 flex items-center justify-center text-[9px]">✓</div>
            <span>Qualify (7.25)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />

          {/* Step 2: Develop */}
          <div className="flex items-center bg-white/70 border border-gray-200 text-gray-600 pl-4 pr-3 py-1.5 rounded-lg gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px] border border-gray-300">
              <Lock className="w-2.5 h-2.5 text-gray-400" />
            </div>
            <span>Develop</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />

          {/* Step 3: Propose */}
          <div className="flex items-center bg-white/70 border border-gray-200 text-gray-600 pl-4 pr-3 py-1.5 rounded-lg gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px] border border-gray-300">
              <Lock className="w-2.5 h-2.5 text-gray-400" />
            </div>
            <span>Propose</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />

          {/* Step 4: Close */}
          <div className="flex items-center bg-white/50 border border-gray-200/50 text-gray-400 pl-4 pr-4 py-1.5 rounded-r-full rounded-l-lg gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px] border border-gray-200">
              <Lock className="w-2.5 h-2.5 text-gray-300" />
            </div>
            <span>Close</span>
          </div>
        </div>
      </div>

      {/* 4. TABS NAVIGATION */}
      <div className="flex items-center gap-1 border-b border-black/[0.03] pb-2 text-xs font-bold">
        <button className="px-5 py-2 bg-black text-white rounded-full shadow-xs">
          Summary
        </button>
        <button className="px-4 py-2 text-gray-400 hover:text-black transition-colors">
          Relationship Analytics
        </button>
        <button className="px-4 py-2 text-gray-400 hover:text-black transition-colors">
          Details
        </button>
        <button className="px-4 py-2 text-gray-400 hover:text-black transition-colors">
          Related
        </button>
      </div>

      {/* 5. BENTO GRID OF WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* COLUMN 1: Contact & Company */}
        <div className="flex flex-col gap-5">
          {/* Contact widget */}
          <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <User2 className="w-4 h-4 text-gray-400" />
              <span>Contact</span>
            </h3>

            <div className="flex flex-col gap-3.5 text-xs">
              <div className="grid grid-cols-3 items-center">
                <span className="text-gray-400 font-semibold">Topic</span>
                <span className="col-span-2 text-gray-900 font-medium leading-relaxed">{lead.contact.topic}</span>
              </div>
              <div className="grid grid-cols-3 items-center">
                <span className="text-gray-400 font-semibold">First Name</span>
                <span className="col-span-2 text-gray-900 font-semibold">{lead.contact.firstName}</span>
              </div>
              <div className="grid grid-cols-3 items-center">
                <span className="text-gray-400 font-semibold">Last Name</span>
                <span className="col-span-2 text-gray-900 font-semibold">{lead.contact.lastName}</span>
              </div>
              <div className="grid grid-cols-3 items-center">
                <span className="text-gray-400 font-semibold">Job Title</span>
                <span className="col-span-2 text-gray-900 font-medium">{lead.contact.jobTitle}</span>
              </div>
              <div className="grid grid-cols-3 items-center">
                <span className="text-gray-400 font-semibold">Business Phone</span>
                <span className="col-span-2 text-gray-900 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {lead.contact.businessPhone}
                </span>
              </div>
              <div className="grid grid-cols-3 items-center">
                <span className="text-gray-400 font-semibold">Mobile Phone</span>
                <span className="col-span-2 text-gray-900 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {lead.contact.mobilePhone}
                </span>
              </div>
              <div className="grid grid-cols-3 items-center">
                <span className="text-gray-400 font-semibold">Email</span>
                <span className="col-span-2 text-sky-600 font-medium flex items-center gap-1 break-all">
                  <Mail className="w-3 h-3 text-sky-500 shrink-0" />
                  {lead.contact.email}
                </span>
              </div>
            </div>
          </div>

          {/* Company widget */}
          <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span>Company</span>
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-3 items-center">
                <span className="text-gray-400 font-semibold">Name</span>
                <span className="col-span-2 text-gray-900 font-semibold">{lead.contact.companyName}</span>
              </div>
              <div className="grid grid-cols-3 items-center">
                <span className="text-gray-400 font-semibold">Website</span>
                <span className="col-span-2 text-sky-600 font-medium break-all">{lead.contact.website}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Up Next & Timeline */}
        <div className="flex flex-col gap-5">
          {/* Up Next Task sequence widget */}
          <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900">Up Next</h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Sequence Active
              </span>
            </div>

            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 p-2 rounded-xl text-center">
              Sequence: New Lead Nurturing
            </div>

            {/* Sequence Tasks timeline */}
            <div className="flex flex-col gap-3">
              {/* Task 1: Highlighted active step */}
              <div className="bg-[#eafda8]/80 rounded-2xl p-3 border border-[#eafda8] flex flex-col gap-2 shadow-xs relative overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-black/60 shadow-xs mt-0.5 shrink-0">
                      <Phone className="w-3.5 h-3.5 stroke-[1.8]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900">{lead.role}</span>
                      <span className="text-[10px] text-gray-500 font-semibold">Step 1 • Due in 1 hour</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-[11px] text-gray-600 font-medium">
                  Call to introduce yourself and verify budget timeline requirements.
                </p>

                <div className="flex items-center justify-between mt-1 gap-2">
                  <button className="flex-1 bg-black text-white py-1.5 px-3 rounded-xl text-[10px] font-bold hover:bg-black/80 transition-colors focus:outline-none shadow-xs">
                    Call Customer
                  </button>
                  <button className="flex-1 bg-white text-gray-700 hover:text-black py-1.5 px-3 rounded-xl text-[10px] font-bold hover:bg-gray-50 transition-colors border border-gray-200 focus:outline-none shadow-xs">
                    Mark Complete
                  </button>
                </div>
              </div>

              {/* Task 2: Standard step */}
              <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                  <Mail className="w-3.5 h-3.5 stroke-[1.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-800">Follow Up Email</span>
                  <span className="text-[10px] text-gray-400 font-semibold">Step 2 • Follow up after call</span>
                </div>
              </div>

              {/* Task 3: Standard step */}
              <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                  <Phone className="w-3.5 h-3.5 stroke-[1.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-800">Second Customer Call</span>
                  <span className="text-[10px] text-gray-400 font-semibold">Step 3 • Due in 4 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline filter/search widget */}
          <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900">Timeline</h3>
              <div className="flex items-center gap-1 text-gray-400">
                <button className="w-6 h-6 rounded-full hover:bg-gray-100 hover:text-black flex items-center justify-center transition-colors">
                  <PlusCircle className="w-3.5 h-3.5" />
                </button>
                <button className="w-6 h-6 rounded-full hover:bg-gray-100 hover:text-black flex items-center justify-center transition-colors">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search Timeline */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search Timeline..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 pl-9 pr-4 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>
        </div>

        {/* COLUMN 3: Lead Score & Who Knows Whom */}
        <div className="flex flex-col gap-5">
          {/* Lead Score Radial Widget */}
          <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900">Lead Score</h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Powered</span>
            </div>

            {/* Score Ring Layout */}
            <div className="flex items-center justify-center gap-6 py-2">
              {/* Left Score Circle */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Score border background */}
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle 
                    cx="56" 
                    cy="56" 
                    r="48" 
                    fill="transparent" 
                    stroke="#f0fdf4" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="56" 
                    cy="56" 
                    r="48" 
                    fill="transparent" 
                    stroke="#10b981" 
                    strokeWidth="8"
                    strokeDasharray={301.59}
                    strokeDashoffset={301.59 - (301.59 * lead.score) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                
                {/* Score text */}
                <div className="flex flex-col items-center justify-center z-10 select-none">
                  <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{lead.score}</span>
                  <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider">{lead.grade}</span>
                </div>
              </div>

              {/* Right Trend indicators */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {lead.scoreTrend}
                </span>
                <p className="text-[10px] text-gray-400 leading-relaxed font-medium max-w-[100px]">
                  Based on interaction frequency, mail sentiment and budget signals.
                </p>
              </div>
            </div>

            {/* Score Insights list */}
            <div className="flex flex-col gap-2.5 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Score Insights
              </span>
              <ul className="space-y-2">
                {lead.scoreInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Who Knows Whom Widget */}
          <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900">Who Knows Whom</h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Connections</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Contact 1 */}
              <div className="flex items-center justify-between gap-3 bg-gray-50/50 border border-gray-100 p-2.5 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-extrabold text-xs">
                    AS
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900">Alan Steiner</span>
                    <span className="text-[10px] text-gray-400 font-semibold">alan@consolidatedcoffee.com</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-wider">
                  Mutual
                </span>
              </div>

              {/* Contact 2 */}
              <div className="flex items-center justify-between gap-3 bg-gray-50/50 border border-gray-100 p-2.5 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-extrabold text-xs">
                    MS
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900">Mike Smith</span>
                    <span className="text-[10px] text-gray-400 font-semibold">m.smith@consolidatedcoffee.com</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[9px] font-bold uppercase tracking-wider">
                  Secondary
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
