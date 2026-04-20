import React, { useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Map as MapIcon,
  Route,
  Users,
  Download,
  Upload,
  Settings,
  Search,
  Truck,
  Bike,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Printer
} from "lucide-react";

// --- Types ---
type Tab = "dashboard" | "routing_config" | "way_management" | "live_map";

type RouteZone = {
  id: string;
  zoneName: string;
  vehicleType: "Bike" | "Van" | "Truck";
  townships: string[];
  assignedRiderId: string;
  assignedVehicleNo: string;
};

type WayplanRow = {
  id: string;
  no: number;
  date: string;
  wayId: string;
  receiverName: string;
  township: string;
  address: string;
  phone: string;
  os: string;
  itemPrice: number;
  deliveryFee: number;
  total: number;
  driver: string;
  carNo: string;
  remark: string;
  status: "pending" | "assigned";
};

// --- Mock Initial Config ---
const INITIAL_ZONES: RouteZone[] = [
  {
    id: "Z-001",
    zoneName: "Ahlone Branch (Downtown)",
    vehicleType: "Bike",
    townships: ["Lanmadaw", "Latha", "Pabedan", "Kyauktada", "Botahtaung", "Pazundaung", "Ahlone", "Kyimyindaing", "Sanchaung"],
    assignedRiderId: "RDR-001 (Kyaw Min)",
    assignedVehicleNo: "BIKE-004",
  },
  {
    id: "Z-002",
    zoneName: "Van 1 (Inner Central)",
    vehicleType: "Van",
    townships: ["Dagon", "Bahan", "Yankin", "Mingala Taungnyunt", "Tamwe"],
    assignedRiderId: "DVR-042 (Zaw Zaw)",
    assignedVehicleNo: "YGN-9P-1234",
  },
];

// Mock data matching your uploaded Excel sheet format
const MOCK_WAYS: WayplanRow[] = [
  { 
    id: "1", no: 1, date: "2026-03-12", wayId: "Yangon671128Yangon", receiverName: "Khit Thit", 
    township: "ဒဂုံဆိပ်ကမ်း", address: "ဒဂုံဆိပ်ကမ်း ဘုရင့်နောင်လမ်း, မြန်မာသားကောင်းအိမ်ရာ", phone: "09665007724, 09665007724", 
    os: "Aung Pyae Sone အထည်", itemPrice: 25500, deliveryFee: 3500, total: 29000, 
    driver: "", carNo: "", remark: "Pending", status: "pending" 
  },
  { 
    id: "2", no: 2, date: "2026-03-12", wayId: "Yangon293117Yangon", receiverName: "Ang Nei Par", 
    township: "ဒဂုံဆိပ်ကမ်း", address: "အခန်း ၀၀၂/စံပယ်လမ်း,တိုက် ၃၂ စစ်တောင်းရိပ်မွန်ယုဇန ဉယျာဉ်မြို့တော်", phone: "09422837461, 09422837461", 
    os: "Aung Pyae Sone အထည်", itemPrice: 115800, deliveryFee: 3500, total: 119300, 
    driver: "", carNo: "", remark: "Pending", status: "pending" 
  },
  { 
    id: "3", no: 174, date: "2026-03-12", wayId: "HQ351125HQ", receiverName: "Baby Kyaw", 
    township: "Ahlone", address: "Ahlone St", phone: "09783878552, 09783878552", 
    os: "", itemPrice: 0, deliveryFee: 2000, total: 2000, 
    driver: "RDR-001", carNo: "BIKE-004", remark: "Assigned", status: "assigned" 
  },
];

// --- Utilities ---
function downloadTemplate() {
  const header = "စဉ်,Date,Way ID,လက်ခံမည့်သူအမည်,မြို့နယ်,လိပ်စာ,ဖုန်း,OS,ပစ္စည်းတန်ဖိုး,ပို့ဆောင်ခ,စုစုပေါင်း,Helper/Driver,Car No,Remark\n";
  const sampleRow = '1,2026-03-12,YGN000001,Aung Aung,Ahlone,"No 1, Main Road","09400500542",Shop,10000,2000,12000,RDR-001,BIKE-004,Urgent\n';
  
  const blob = new Blob([header + sampleRow], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Wayplan_Upload_Template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function CombinedSupervisorPortal() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [zones, setZones] = useState<RouteZone[]>(INITIAL_ZONES);
  const [isPrinting, setIsPrinting] = useState(false);

  // --- Handlers ---
  const handleAutoGenerate = () => {
    alert("System compiling intake data...\nApplying internal routing logic...\nWayplans automatically generated and assigned to riders based on active Zone configurations!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Fallback File "${file.name}" uploaded successfully. Parsing rows to generate wayplan...`);
    }
  };

  const addZone = () => {
    const newZone: RouteZone = {
      id: `Z-00${zones.length + 1}`,
      zoneName: "New Zone",
      vehicleType: "Van",
      townships: [],
      assignedRiderId: "Unassigned",
      assignedVehicleNo: "Unassigned"
    };
    setZones([...zones, newZone]);
  };

  const removeZone = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  // --- Print Injector ---
  const printStyles = `
    @media print {
      body * { visibility: hidden; }
      .print-engine, .print-engine * { visibility: visible; }
      .print-engine { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
      .no-print { display: none !important; }
      @page { size: landscape; margin: 10mm; }
      
      table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 10px; }
      th, td { border: 1px solid #000; padding: 4px; text-align: left; }
      th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; font-weight: bold; }
    }
  `;

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative">
      <style>{printStyles}</style>

      {/* --- PRINT ENGINE (Hidden in UI, Visible in Print) --- */}
      {isPrinting && (
        <div className="print-engine hidden print:block bg-white p-4">
          <h2 className="text-xl font-bold mb-4">11.3.26 Daily Pending</h2>
          <table>
            <thead>
              <tr>
                <th>စဉ်</th>
                <th>Date</th>
                <th>Way ID</th>
                <th>လက်ခံမည့်သူအမည်</th>
                <th>မြို့နယ်</th>
                <th>လိပ်စာ</th>
                <th>ဖုန်း</th>
                <th>OS</th>
                <th>ပစ္စည်းတန်ဖိုး</th>
                <th>ပို့ဆောင်ခ</th>
                <th>စုစုပေါင်း</th>
                <th>Helper/Driver</th>
                <th>Car No</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_WAYS.map((row) => (
                <tr key={row.id}>
                  <td>{row.no}</td>
                  <td>{row.date}</td>
                  <td>{row.wayId}</td>
                  <td>{row.receiverName}</td>
                  <td>{row.township}</td>
                  <td>{row.address}</td>
                  <td>{row.phone}</td>
                  <td>{row.os}</td>
                  <td>{row.itemPrice.toLocaleString()}</td>
                  <td>{row.deliveryFee.toLocaleString()}</td>
                  <td>{row.total.toLocaleString()}</td>
                  <td>{row.driver}</td>
                  <td>{row.carNo}</td>
                  <td>{row.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MAIN UI (Hidden in Print) --- */}
      <div className="print:hidden">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d2c54] text-white shadow-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#0d2c54]">Supervisor Control Hub</h1>
              <p className="text-sm font-medium text-slate-500">Operations, Routing & Way Management</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {[
              { id: "dashboard", icon: Activity, label: "Overview" },
              { id: "routing_config", icon: Route, label: "Routing Config" },
              { id: "way_management", icon: FileSpreadsheet, label: "Way Management" },
              { id: "live_map", icon: MapIcon, label: "Live Map" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#0d2c54] text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* --- TAB: DASHBOARD --- */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Active Fleet (Live)", value: "24 Riders", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50" },
                { title: "Pending Wayplans", value: "3 Batches", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
                { title: "Completed Ways Today", value: "148", icon: CheckCircle, color: "text-sky-500", bg: "bg-sky-50" },
              ].map((s) => (
                <div key={s.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">{s.title}</h3>
                    <div className={`rounded-xl ${s.bg} p-3 ${s.color}`}>
                      <s.icon size={20} />
                    </div>
                  </div>
                  <div className="mt-4 text-3xl font-black text-[#0d2c54]">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: ROUTING CONFIG --- */}
        {activeTab === "routing_config" && (
          <div className="grid gap-6 xl:grid-cols-12">
            
            {/* Left Column: Automation & Fallback */}
            <div className="space-y-6 xl:col-span-4">
              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <Settings className="h-6 w-6 text-emerald-600" />
                  <h2 className="text-lg font-black text-emerald-950">System Auto-Compiler</h2>
                </div>
                <p className="mb-6 text-sm text-emerald-800/80">
                  Primary Option: Pull all recent intake data and automatically map them to zones, calculating total weights and generating sub-way IDs based on current active rules.
                </p>
                <button 
                  onClick={handleAutoGenerate}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition"
                >
                  <RefreshCw size={18} />
                  Auto-Generate Wayplan
                </button>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <FileSpreadsheet className="h-6 w-6 text-slate-700" />
                  <h2 className="text-lg font-black text-[#0d2c54]">Fallback Data Entry</h2>
                </div>
                <p className="mb-6 text-sm text-slate-500">
                  Secondary Option: Download the pre-defined template, fill data offline, and re-upload to force wayplan generation.
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Download size={16} />
                    Download Template
                  </button>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".csv, .xlsx" 
                      onChange={handleFileUpload}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <div className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-100">
                      <Upload size={16} />
                      Upload Completed File
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Zone Logic Configurations */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-8">
               <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-[#0d2c54]">Routing & Zone Configuration</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">Define township grouping and assign fleet members.</p>
                  </div>
                  <button 
                    onClick={addZone}
                    className="flex items-center gap-2 rounded-xl bg-[#0d2c54] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#1a3d6a]"
                  >
                    <Plus size={16}/> Add Zone
                  </button>
               </div>

               <div className="space-y-4">
                  {zones.map((zone) => (
                    <div key={zone.id} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <button onClick={() => removeZone(zone.id)} className="absolute right-4 top-4 text-rose-400 hover:text-rose-600">
                         <Trash2 size={16}/>
                      </button>
                      <div className="grid gap-4 md:grid-cols-2">
                         <div>
                           <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Zone Name</label>
                           <input defaultValue={zone.zoneName} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-[#0d2c54] outline-none focus:border-sky-500" />
                         </div>
                         <div>
                           <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Townships Covered</label>
                           <input defaultValue={zone.townships.join(", ")} placeholder="Comma separated townships" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500" />
                         </div>
                         <div>
                           <label className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><Users size={12}/> Assigned Rider / Driver</label>
                           <input defaultValue={zone.assignedRiderId} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-sky-700 outline-none focus:border-sky-500" />
                         </div>
                         <div className="flex gap-2">
                           <div className="flex-1">
                             <label className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><Truck size={12}/> Vehicle No</label>
                             <input defaultValue={zone.assignedVehicleNo} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-sky-500" />
                           </div>
                           <div className="w-24">
                             <label className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</label>
                             <select defaultValue={zone.vehicleType} className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none">
                                <option>Bike</option>
                                <option>Van</option>
                                <option>Truck</option>
                             </select>
                           </div>
                         </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* --- TAB: WAY MANAGEMENT --- */}
        {activeTab === "way_management" && (
          <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#0d2c54]">Way Management Roster</h2>
                <p className="text-sm text-slate-500">View, manage, and export daily route lists.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full lg:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search Way ID, Phone..." 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-sky-600 transition"
                >
                  <Printer size={16}/> Print List
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-4">စဉ်</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4">Way ID</th>
                    <th className="px-4 py-4">လက်ခံမည့်သူအမည်</th>
                    <th className="px-4 py-4">မြို့နယ် & လိပ်စာ</th>
                    <th className="px-4 py-4">ဖုန်း</th>
                    <th className="px-4 py-4">စုစုပေါင်း (MMK)</th>
                    <th className="px-4 py-4">Helper/Driver</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_WAYS.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-4 text-slate-500">{row.no}</td>
                      <td className="px-4 py-4 text-slate-600">{row.date}</td>
                      <td className="px-4 py-4 font-mono font-bold text-[#0d2c54]">{row.wayId}</td>
                      <td className="px-4 py-4 font-bold">{row.receiverName}</td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-700">{row.township}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{row.address}</div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">{row.phone}</td>
                      <td className="px-4 py-4 font-black text-emerald-600">{row.total.toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-700">{row.driver || "-"}</div>
                        <div className="text-xs text-slate-500">{row.carNo}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                          row.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="text-sky-600 hover:text-sky-800 p-2 rounded-lg hover:bg-sky-50 transition">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB: LIVE MAP --- */}
        {activeTab === "live_map" && (
          <div className="relative h-[700px] w-full overflow-hidden rounded-[32px] border border-slate-200 bg-slate-100 shadow-sm">
            {/* Mapbox Container Shell */}
            <div className="absolute inset-0 bg-[#e5e9ec] flex items-center justify-center">
               <div className="text-center">
                  <MapIcon size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-black text-slate-500">Mapbox Live Tracking Active</h3>
                  <p className="text-sm font-medium text-slate-400 mt-2">Awaiting MapboxGL token and geospatial coordinate ingestion.</p>
               </div>
            </div>
            
            {/* Overlay UI */}
            <div className="absolute left-6 top-6 w-80 rounded-[24px] bg-white/90 p-5 shadow-xl backdrop-blur-md">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#0d2c54] flex items-center gap-2">
                 <Activity size={16} className="text-emerald-500" /> Dispatch Radar
              </h3>
              <div className="mt-4 space-y-3">
                 <div className="flex items-center justify-between text-sm border-b border-slate-200 pb-2">
                   <span className="font-bold flex items-center gap-2 text-slate-700"><Bike size={14}/> Active Bikes</span>
                   <span className="font-black text-emerald-600">12</span>
                 </div>
                 <div className="flex items-center justify-between text-sm border-b border-slate-200 pb-2">
                   <span className="font-bold flex items-center gap-2 text-slate-700"><Truck size={14}/> Active Vans</span>
                   <span className="font-black text-emerald-600">8</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="font-bold flex items-center gap-2 text-slate-700"><AlertTriangle size={14} className="text-amber-500"/> Unassigned Pins</span>
                   <span className="font-black text-amber-600">42</span>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}