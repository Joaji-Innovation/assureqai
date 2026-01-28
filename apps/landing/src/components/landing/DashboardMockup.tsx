"use client";

import { 
  Activity, 
  AlertCircle, 
  BarChart3, 
  CheckCircle2, 
  ChevronDown, 
  LayoutDashboard, 
  MoreHorizontal, 
  Search, 
  Settings, 
  Users, 
  Bell,
  ShieldAlert,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export const DashboardMockup = () => {
  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#050505] border border-white/[0.1] shadow-2xl flex flex-col font-sans">
      
      {/* ==================== Browser Toolbar (Top) ==================== */}
      <div className="h-10 border-b border-white/[0.08] bg-[#0A0A0A] flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50" />
        </div>
        <div className="flex-1 max-w-sm mx-4 h-6 bg-black/40 rounded-md border border-white/[0.05] flex items-center justify-center text-[10px] text-muted-foreground/60 font-mono tracking-wide">
             https://app.assureqai.com/dashboard/overview
        </div>
        <div className="w-12 opacity-0"></div>
      </div>

      {/* ==================== App Layout ==================== */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- Sidebar (Left) --- */}
        <div className="w-16 border-r border-white/[0.08] bg-[#080808] flex flex-col items-center py-6 gap-6 z-10">
           <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mb-2">
             <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
           </div>
           {[LayoutDashboard, Activity, Users, AlertCircle, Settings].map((Icon, i) => (
             <div key={i} className={`p-2.5 rounded-lg transition-colors ${i === 0 ? "bg-white/[0.08] text-white" : "text-muted-foreground hover:text-white hover:bg-white/[0.05]"}`}>
               <Icon className="w-5 h-5" />
             </div>
           ))}
        </div>

        {/* --- Main Content Area --- */}
        <div className="flex-1 bg-[#030303] flex flex-col relative overflow-hidden">
             
             {/* Header */}
             <div className="h-16 border-b border-white/[0.08] flex items-center justify-between px-8 bg-[#030303]/80 backdrop-blur-xl z-10">
                 <div className="flex items-center gap-4">
                     <h2 className="text-white font-semibold tracking-tight">Q3 - Audit Overview</h2>
                     <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs border border-emerald-500/20 font-medium">Live</span>
                 </div>
                 <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-muted-foreground text-xs">
                         <span>Last 30 Days</span>
                         <ChevronDown className="w-3 h-3" />
                     </div>
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20" />
                 </div>
             </div>

             {/* Dashboard Grid */}
             <div className="p-8 grid grid-cols-12 gap-6 overflow-hidden">
                 
                 {/* 1. Metric Cards (Top Row) */}
                 <div className="col-span-12 grid grid-cols-3 gap-6">
                      <MetricCard 
                        title="Audit Coverage" 
                        value="98.2%" 
                        trend="+12%" 
                        good={true} 
                        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      />
                      <MetricCard 
                        title="Fatal Error Rate" 
                        value="0.8%" 
                        trend="-4.3%" 
                        good={true}
                        icon={<ShieldAlert className="w-4 h-4 text-primary" />}
                      />
                      <MetricCard 
                        title="Avg QA Score" 
                        value="87.4" 
                        trend="+2.1" 
                        good={true}
                        icon={<BarChart3 className="w-4 h-4 text-blue-500" />}
                      />
                 </div>

                 {/* 2. Main Chart (Large) */}
                 <div className="col-span-8 bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 relative group overflow-hidden">
                     <div className="flex justify-between items-start mb-6 z-10 relative">
                         <div>
                             <h3 className="text-white text-sm font-medium">Defect Trends (Parameter Wise)</h3>
                             <p className="text-muted-foreground text-xs mt-1">Compliance vs. Process Adherence</p>
                         </div>
                         <MoreHorizontal className="text-muted-foreground w-4 h-4" />
                     </div>
                     
                     {/* Simulated Line Chart (SVG) */}
                     <div className="h-48 w-full relative pl-2">
                         {/* Grid Lines */}
                         <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.05]" />
                         <div className="absolute inset-x-0 bottom-12 h-px bg-white/[0.05]" />
                         <div className="absolute inset-x-0 bottom-24 h-px bg-white/[0.05]" />
                         <div className="absolute inset-x-0 bottom-36 h-px bg-white/[0.05]" />
                         
                         {/* Mock Line Path (Purple) */}
                         <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                             <defs>
                               <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                                 <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                               </linearGradient>
                             </defs>
                             <path 
                               d="M0 35 Q 10 32, 20 25 T 40 30 T 60 15 T 80 20 T 100 5 L 100 50 L 0 50 Z" 
                               fill="url(#gradientPrimary)" 
                               opacity="0.5"
                             />
                             <path 
                               d="M0 35 Q 10 32, 20 25 T 40 30 T 60 15 T 80 20 T 100 5" 
                               fill="none" 
                               stroke="#6366f1" 
                               strokeWidth="1.5"
                               strokeLinecap="round"
                             />
                              {/* Second Line (Cyan - Mock) */}
                              <path 
                               d="M0 45 Q 15 40, 30 42 T 50 35 T 70 38 T 100 25" 
                               fill="none" 
                               stroke="#06b6d4" 
                               strokeWidth="1.5"
                               strokeLinecap="round"
                               strokeDasharray="3 3"
                               opacity="0.6"
                             />
                         </svg>

                         {/* Hover Effect Tooltip Simulator */}
                         <div className="absolute top-[30%] left-[60%] w-px h-[70%] bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute -top-8 -left-8 bg-black border border-white/20 rounded-md px-2 py-1 shadow-lg">
                                  <span className="text-[10px] text-white whitespace-nowrap">Defect Rate: 1.2%</span>
                              </div>
                              <div className="w-2 h-2 bg-primary rounded-full absolute top-0 -left-[3.5px] border-2 border-black" />
                         </div>
                     </div>
                 </div>

                 {/* 3. Recent Critical Alerts (Right Panel) */}
                 <div className="col-span-4 bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-0 overflow-hidden flex flex-col">
                     <div className="p-4 border-b border-white/[0.05]">
                         <h3 className="text-white text-sm font-medium">Critical Alerts</h3>
                     </div>
                     <div className="flex-1 p-2 space-y-1">
                          <AlertItem text="Missed DNC Disclosure" time="2m ago" severity="high" />
                          <AlertItem text="Abusive Language" time="15m ago" severity="high" />
                          <AlertItem text="Wrong Product Details" time="1h ago" severity="medium" />
                          <AlertItem text="Call Drop (Agent Side)" time="2h ago" severity="medium" />
                     </div>
                 </div>

             </div>
             
             {/* Background Grid Pattern for Main Content */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none -z-0" />
        
        </div>
      </div>
    </div>
  );
};

// --- Sub-components (Internal only for Mockup) ---

const MetricCard = ({ title, value, trend, good, icon }: any) => (
  <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-3 group hover:border-white/[0.15] transition-colors relative overflow-hidden">
       {/* Hover Glow */}
       <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
       
       <div className="flex justify-between items-start">
           <span className="text-muted-foreground text-xs font-medium">{title}</span>
           <div className={`p-1.5 rounded-md ${good ? 'bg-white/[0.03]' : 'bg-red-500/10'}`}>
               {icon}
           </div>
       </div>
       <div>
           <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
           <div className={`flex items-center gap-1 text-[10px] mt-1 font-medium ${good && trend.includes('+') ? 'text-emerald-500' : 'text-emerald-500'}`}>
               {good ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
               <span>{trend} vs last week</span>
           </div>
       </div>
  </div>
);

const AlertItem = ({ text, time, severity }: any) => (
  <div className="flex items-center gap-3 p-2.5 hover:bg-white/[0.03] rounded-lg transition-colors cursor-default group">
       <div className={`w-1.5 h-1.5 rounded-full ${severity === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500'}`} />
       <div className="flex-1">
           <div className="text-white text-xs font-medium group-hover:text-primary transition-colors">{text}</div>
           <div className="text-muted-foreground text-[10px]">Agent: John D. • Campaign A</div>
       </div>
       <div className="text-muted-foreground text-[10px]">{time}</div>
  </div>
);
