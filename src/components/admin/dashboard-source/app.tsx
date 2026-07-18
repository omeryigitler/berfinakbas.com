"use client";

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MyWorkPanel from './MyWorkPanel';
import WorkspacePanel from './WorkspacePanel';

export default function App() {
  const [activeMenuItem, setActiveMenuItem] = useState('sales-accelerator');
  const [selectedLeadId, setSelectedLeadId] = useState('gabriela');

  return (
    <div id="app-root-layout" className="flex h-screen bg-crm-sidebar text-[#323130] overflow-hidden font-sans">
      
      {/* 1. LEFT SIDEBAR MENU */}
      <Sidebar 
        activeMenuItem={activeMenuItem} 
        setActiveMenuItem={setActiveMenuItem} 
      />

      {/* 2. RIGHT SIDE MAIN AREA - Header at the top directly on the sidebar background */}
      <div className="flex-1 bg-crm-sidebar h-screen flex flex-col overflow-hidden">
        <Header />
        
        {/* Main content container with My Work Panel and an empty workspace area */}
        <div className="flex-1 flex gap-2 pl-1 pr-6 pb-6 overflow-hidden">
          <MyWorkPanel 
            selectedLeadId={selectedLeadId} 
            onSelectLead={setSelectedLeadId} 
          />
          
          {/* Main workspace details area with high-fidelity gradient styling */}
          <WorkspacePanel selectedLeadId={selectedLeadId} />
        </div>
      </div>

    </div>
  );
}
