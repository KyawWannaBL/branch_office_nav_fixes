import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ImagePlus,
  PackagePlus,
  PenTool,
  Printer,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";

// --- Types & Interfaces ---
type IntakeRow = {
  id: string;
  mainWayId: string;
  subWayId: string;
  
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  
  recipientName: string;
  recipientPhone: string;
  recipientTownship: string;
  recipientAddress: string;
  
  itemName: string;
  qty: number;
  weightKg: number;
  
  paymentTerm: "COD" | "PREPAID" | "ACCOUNT";
  deliveryFee: number;
  extraWeightCharge: number;
  codAmount: number;
  
  note: string;
  isValid: boolean;
};

type PrintSize = "4x6" | "4x3" | "A5" | "A4";

const DRAFT_KEY = "britium-data-entry-v2-draft";
const CURRENT_USER_ID = "USR-8842";

// --- Mock Data for Autocomplete ---
// In production, these should be fetched from your Supabase database.
const MYANMAR_TOWNSHIPS = [
  "Ahlone, Yangon", "Bahan, Yangon", "Botataung, Yangon", "Dagon, Yangon", 
  "Dagon Seikkan, Yangon", "East Dagon, Yangon", "Hlaing, Yangon", "Hlaingthaya, Yangon", 
  "Insein, Yangon", "Kamayut, Yangon", "Kyauktada, Yangon", "Kyimyindaing, Yangon", 
  "Lanmadaw, Yangon", "Latha, Yangon", "Mayangon, Yangon", "Mingaladon, Yangon", 
  "North Dagon, Yangon", "North Okkalapa, Yangon", "Pabedan, Yangon", "Pazundaung, Yangon", 
  "Sanchaung, Yangon", "South Dagon, Yangon", "South Okkalapa, Yangon", "Tamwe, Yangon", 
  "Thaketa, Yangon", "Thingangyun, Yangon", "Yankin, Yangon",
  "Chanayethazan, Mandalay", "Maha Aungmye, Mandalay", "Pyigyidagun, Mandalay"
];

const HISTORICAL_CUSTOMERS = [
  { name: "U Aung Myo Khine", phone: "09400500542", address: "No. 277, Anawrahta Road, East Dagon", township: "East Dagon, Yangon" },
  { name: "Ma Pan Ei", phone: "09792970776", address: "Building 4, SITC Complex, Pyay Road", township: "Kamayut, Yangon" },
  { name: "Sain Yan Htun", phone: "09234567890", address: "Hlaing Station Road, Block 3", township: "Hlaing, Yangon" },
  { name: "Kyaw Wanna", phone: "09555666777", address: "Royal Green River Apartment, Rm 102", township: "Bahan, Yangon" },
  { name: "Super Merchant Co.", phone: "09111222333", address: "Warehouse 5, Bayintnaung", township: "Mayangon, Yangon" }
];

// --- Utilities ---
function generateMainWayId() {
  return `BEX-M-${Math.floor(Math.random() * 1000000).toString().padStart(6, "0")}`;
}

function generateSubWayId(mainId: string, index: number) {
  const suffix = mainId.split("-").pop() || "000";
  return `BEX-S-${suffix}-${index.toString().padStart(3, "0")}`;
}

function makeRow(mainId?: string, index: number = 1): IntakeRow {
  const mId = mainId || generateMainWayId();
  return {
    id: crypto.randomUUID(),
    mainWayId: mId,
    subWayId: generateSubWayId(mId, index),
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    recipientName: "",
    recipientPhone: "",
    recipientTownship: "",
    recipientAddress: "",
    itemName: "",
    qty: 1,
    weightKg: 0,
    paymentTerm: "COD",
    deliveryFee: 0,
    extraWeightCharge: 0,
    codAmount: 0,
    note: "",
    isValid: false,
  };
}

function validateRow(row: IntakeRow): boolean {
  if (!row.senderName.trim() || !row.senderPhone.trim() || !row.senderAddress.trim()) return false;
  if (!row.recipientName.trim() || !row.recipientPhone.trim() || !row.recipientTownship.trim() || !row.recipientAddress.trim()) return false;
  if (!row.itemName.trim() || row.qty < 1 || row.weightKg < 0) return false;
  if (row.paymentTerm === "COD" && row.codAmount <= 0) return false;
  return true;
}

function toCsv(rows: IntakeRow[]) {
  const header = [
    "main_way_id", "sub_way_id", "sender_name", "sender_phone", "sender_address",
    "recipient_name", "recipient_phone", "recipient_township", "recipient_address",
    "item_name", "qty", "weight_kg", "payment_term", "delivery_fee", "surcharge", "cod_amount", "note"
  ];
  const body = rows.map((r) => [
    r.mainWayId, r.subWayId, r.senderName, r.senderPhone, r.senderAddress,
    r.recipientName, r.recipientPhone, r.recipientTownship, r.recipientAddress,
    r.itemName, String(r.qty), String(r.weightKg), r.paymentTerm, String(r.deliveryFee), String(r.extraWeightCharge), String(r.codAmount), r.note,
  ]);
  return [header, ...body].map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Components ---

// Autocomplete Input Component
function AutocompleteInput({
  value,
  onChange,
  onSelectSuggestion,
  data,
  extractLabel,
  placeholder,
  className,
  renderSuggestion,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelectSuggestion?: (item: any) => void;
  data: any[];
  extractLabel: (item: any) => string;
  placeholder?: string;
  className?: string;
  renderSuggestion?: (item: any) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState<any[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value) {
      setFiltered([]);
      return;
    }
    const lowerVal = value.toLowerCase();
    const matches = data.filter(item => {
      // Search by name, phone, or standard string depending on the data shape
      if (typeof item === 'string') return item.toLowerCase().includes(lowerVal);
      return item.name.toLowerCase().includes(lowerVal) || item.phone.includes(lowerVal);
    });
    setFiltered(matches);
  }, [value, data]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-2xl mt-1 text-xs left-0">
          {filtered.map((item, idx) => (
            <li
              key={idx}
              className="px-3 py-2 hover:bg-sky-50 cursor-pointer border-b border-slate-100 last:border-none transition-colors"
              onMouseDown={(e) => {
                // Use onMouseDown instead of onClick to prevent input blur firing first
                e.preventDefault();
                onChange(extractLabel(item));
                if(onSelectSuggestion) onSelectSuggestion(item);
                setIsOpen(false);
              }}
            >
              {renderSuggestion ? renderSuggestion(item) : extractLabel(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Electronic Signature Pad
const SignaturePad = ({ onSave }: { onSave: (dataUrl: string) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d")?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0d2c54";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-700 flex items-center gap-2"><PenTool size={16}/> Electronic Signature</h3>
        <button onClick={clear} className="text-xs text-rose-500 hover:text-rose-700 font-bold">Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseMove={draw}
        onMouseOut={endDrawing}
        onTouchStart={startDrawing}
        onTouchEnd={endDrawing}
        onTouchMove={draw}
        className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 cursor-crosshair touch-none"
      />
      <button 
        onClick={() => onSave(canvasRef.current?.toDataURL() || "")} 
        className="mt-3 w-full rounded-xl bg-sky-700 py-2 text-xs font-black text-white uppercase tracking-widest hover:bg-sky-600"
      >
        Capture Signature
      </button>
    </div>
  );
};

// Waybill Print Template
const WaybillTemplate = ({ row }: { row: IntakeRow }) => (
  <div className="waybill-container flex flex-col border-2 border-black bg-white p-4 h-full w-full mx-auto relative overflow-hidden font-sans">
    <div className="flex justify-between items-start border-b-2 border-black pb-3">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xl tracking-tighter">BEX</div>
        <div>
          <h1 className="text-xl font-black leading-tight">BRITIUM EXPRESS</h1>
          <p className="text-xs font-bold text-slate-600 tracking-widest">DELIVERY SERVICE</p>
          <p className="text-xs font-bold mt-1">HotLine: 09 400 500 542</p>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-[10px] font-black">{row.subWayId}</div>
        <div className="h-20 w-20 bg-slate-200 border border-slate-300 flex items-center justify-center m-1">
           <QrCode size={48} className="text-slate-400" />
        </div>
        <div className="text-[10px] font-black">{row.subWayId}</div>
        <div className="text-[8px] text-slate-500 mt-1">P-User: {CURRENT_USER_ID}</div>
      </div>
    </div>
    <div className="border-b-2 border-black py-2">
      <p className="text-xs"><span className="font-bold">Merchant:</span> {row.senderName} ({row.senderPhone})</p>
      <p className="text-xs truncate">{row.senderAddress}</p>
    </div>
    <div className="border-b-2 border-black py-4 flex-1">
      <div className="flex gap-2">
        <span className="font-bold text-sm">Recipient:</span>
        <div>
          <p className="text-lg font-black">{row.recipientTownship}</p>
          <p className="text-md font-bold mt-2">{row.recipientPhone}</p>
          <p className="text-md font-bold mt-1">{row.recipientName}</p>
          <p className="text-sm mt-3 leading-relaxed">{row.recipientAddress}</p>
        </div>
      </div>
    </div>
    <div className="border-b-2 border-black py-2 flex justify-between text-xs">
      <p><span className="font-bold">Item:</span> {row.itemName} (Qty: {row.qty})</p>
      <p><span className="font-bold">Total Wt:</span> {row.weightKg} kg</p>
    </div>
    <div className="border-b-2 border-black py-2">
      <p className="text-xs"><span className="font-bold">Remarks:</span> {row.note || "N/A"}</p>
    </div>
    <div className="py-3 flex justify-between items-center border-b-2 border-black">
      <div className="text-xs space-y-1">
        <p className="flex justify-between w-40"><span>Delivery Fee:</span> <span>{row.deliveryFee.toLocaleString()}</span></p>
        <p className="flex justify-between w-40 text-rose-600"><span>Surcharge:</span> <span>{row.extraWeightCharge.toLocaleString()}</span></p>
        <p className="flex justify-between w-40 font-bold"><span>Payment:</span> <span>{row.paymentTerm}</span></p>
      </div>
      <div className="rounded-xl border-2 border-black bg-slate-200 px-4 py-2 text-right min-w-[140px]">
        <p className="text-xs font-black uppercase tracking-widest text-slate-600">COD MMK</p>
        <p className="text-xl font-black mt-1">{row.codAmount.toLocaleString()}</p>
      </div>
    </div>
    <div className="pt-2 text-[10px] font-bold text-center leading-tight">
      ငွေပေးချေမှုနှင့် ပတ်သက်၍ အခက်အခဲရှိပါက Hotline သို့ ဆက်သွယ်တိုင်ကြားနိုင်ပါသည်။
    </div>
  </div>
);


export default function DataEntryPortal() {
  const [rows, setRows] = useState<IntakeRow[]>([makeRow()]);
  const [query, setQuery] = useState("");
  
  // Printing State
  const [printSize, setPrintSize] = useState<PrintSize>("4x6");
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Photo Gallery State
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as IntakeRow[];
        if (Array.isArray(parsed) && parsed.length) setRows(parsed);
      } catch {}
    }
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.mainWayId, r.subWayId, r.senderName, r.recipientName, r.recipientPhone, r.itemName].join(" ").toLowerCase().includes(q)
    );
  }, [rows, query]);

  function patchRow(id: string, key: keyof IntakeRow, value: string | number) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [key]: value };
          updated.isValid = validateRow(updated);
          return updated;
        }
        return row;
      })
    );
  }

  function applyHistoricalData(id: string, role: "sender" | "recipient", customer: any) {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        const updated = { ...row };
        if (role === "sender") {
          updated.senderName = customer.name;
          updated.senderPhone = customer.phone;
          updated.senderAddress = customer.address;
        } else {
          updated.recipientName = customer.name;
          updated.recipientPhone = customer.phone;
          updated.recipientAddress = customer.address;
          updated.recipientTownship = customer.township;
        }
        updated.isValid = validateRow(updated);
        return updated;
      }
      return row;
    }));
  }

  function addRow(mainId?: string) {
    const activeMainId = mainId || (rows.length > 0 ? rows[rows.length - 1].mainWayId : generateMainWayId());
    const count = rows.filter(r => r.mainWayId === activeMainId).length + 1;
    setRows((prev) => [...prev, makeRow(activeMainId, count)]);
  }

  function createNewBatch() {
    addRow(generateMainWayId());
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredRows.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredRows.map(r => r.id)));
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(rows));
    alert("Draft saved securely in local storage.");
  }

  function clearDraft() {
    if(confirm("Are you sure you want to clear all rows?")) {
      localStorage.removeItem(DRAFT_KEY);
      setRows([makeRow()]);
      setPhotos([]);
      setSelectedIds(new Set());
    }
  }

  function downloadTemplate() {
    const template = toCsv([makeRow()]);
    downloadText("britium_bulk_intake_template.csv", template);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const urls = files.map(file => URL.createObjectURL(file));
    setPhotos(prev => [...prev, ...urls]);
  }

  function handlePrint() {
    if(selectedIds.size === 0) {
      alert("Please select at least one row to print.");
      return;
    }
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  }

  // --- Print Injector ---
  const printStyles = `
    @media print {
      body * { visibility: hidden; }
      .print-engine, .print-engine * { visibility: visible; }
      .print-engine { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
      .no-print { display: none !important; }
      @page { margin: 0; }
      ${printSize === '4x6' ? '@page { size: 4in 6in; } .page-break { page-break-after: always; height: 6in; width: 4in; overflow: hidden; }' : ''}
      ${printSize === '4x3' ? '@page { size: 4in 6in; } .page-break { page-break-after: always; height: 6in; width: 4in; overflow: hidden; display: flex; flex-direction: column; } .waybill-container { height: 50% !important; border-bottom: 2px dashed #ccc !important; }' : ''}
      ${printSize === 'A5' ? '@page { size: A5; margin: 1cm; } .page-break { page-break-after: always; height: 100vh; }' : ''}
      ${printSize === 'A4' ? '@page { size: A4; margin: 1cm; } .page-break { page-break-after: always; height: 100vh; }' : ''}
    }
  `;

  const printRows = rows.filter(r => selectedIds.has(r.id));
  const printChunks = printSize === '4x3' 
    ? printRows.reduce((acc, _, i) => (i % 2 === 0 ? [...acc, printRows.slice(i, i + 2)] : acc), [] as IntakeRow[][])
    : printRows.map(r => [r]);

  return (
    <div className="space-y-6 print:bg-white relative">
      <style>{printStyles}</style>

      {/* --- PRINT ENGINE (Hidden in UI, Visible in Print) --- */}
      {isPrinting && (
        <div className="print-engine hidden print:block bg-white">
          {printChunks.map((chunk, idx) => (
            <div key={idx} className="page-break bg-white">
              {chunk.map(row => (
                <WaybillTemplate key={row.id} row={row} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* --- MAIN UI (Hidden in Print) --- */}
      <div className="print:hidden space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                Head Office Operations
              </div>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-[#0d2c54]">
                Enterprise Data Entry
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                Rigorous intake portal enforcing complete data capture with predictive autocomplete. Generate Main/Sub Way IDs, 
                verify parcel galleries, and print multi-format waybills directly to thermal printers.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {/* Printing & Action Controls */}
          <div className="rounded-[28px] border border-slate-200 bg-white/65 p-6 shadow-sm backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Printer className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-black text-[#0d2c54]">Waybill Printing Engine</h2>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-bold text-slate-600">Print Format:</label>
                <select 
                  value={printSize} 
                  onChange={e => setPrintSize(e.target.value as PrintSize)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#0d2c54] outline-none"
                >
                  <option value="4x6">Standard Thermal (4" x 6")</option>
                  <option value="4x3">Split Thermal (4" x 3" - 2 per page)</option>
                  <option value="A5">A5 Sheet</option>
                  <option value="A4">A4 Sheet</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
               <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-2xl bg-[#0d2c54] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg hover:bg-[#1a3d6a]">
                  <Printer className="h-4 w-4" /> Print Selected ({selectedIds.size})
               </button>
               <button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-700 hover:bg-slate-50">
                  <Download className="h-4 w-4" /> CSV Template
               </button>
            </div>
          </div>

          {/* Signature Pad */}
          <div className="rounded-[28px] border border-slate-200 bg-white/65 p-6 shadow-sm backdrop-blur-md">
             <SignaturePad onSave={(data) => console.log("Signature saved")} />
          </div>
        </div>

        {/* Filmstrip Photo Viewer */}
        <div className="rounded-[28px] border border-slate-200 bg-white/65 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-sky-700" />
              <h2 className="text-lg font-black text-[#0d2c54]">Parcel Evidence Gallery</h2>
            </div>
            <div>
              <button onClick={() => fileInputRef.current?.click()} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
                + Add Photos
              </button>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
            </div>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 hide-scrollbar">
            {photos.length === 0 ? (
              <div className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center text-sm font-bold text-slate-400">
                No evidence uploaded. Click "Add Photos" to begin inspection.
              </div>
            ) : (
              photos.map((url, i) => (
                <div key={i} className="relative h-40 w-40 flex-shrink-0 rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                  <img src={url} alt={`evidence-${i}`} className="h-full w-full object-cover" />
                  <button onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                    <XCircle size={16}/>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-[28px] border border-slate-200 bg-white/65 p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-[#0d2c54]">Strict Intake Roster with Autocomplete</h2>
              <p className="mt-1 text-sm text-slate-500">Type names or numbers to see historical suggestions. Rows missing data are blocked.</p>
            </div>

            <div className="flex items-center gap-3">
               <button onClick={createNewBatch} className="inline-flex items-center gap-2 rounded-xl bg-[#ffd700] text-[#0d2c54] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] hover:brightness-105">
                 <PackagePlus size={16}/> New Bulk Batch
               </button>
               <button onClick={saveDraft} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                 <Save size={16}/> Save Draft
               </button>
               <button onClick={clearDraft} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-2 text-xs font-black hover:bg-rose-100">
                 <Trash2 size={16}/> Clear
               </button>
            </div>
          </div>

          <div className="overflow-visible rounded-2xl border border-slate-200 bg-white/90 pb-32">
            <table className="w-max min-w-full text-sm">
              <thead className="bg-[#0d2c54] text-left text-white/90 font-mono text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-3 py-4 text-center">
                     <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filteredRows.length} className="accent-[#ffd700]" />
                  </th>
                  <th className="px-3 py-4">Main Way ID</th>
                  <th className="px-3 py-4">Sub Way ID</th>
                  <th className="px-3 py-4">Sender Info</th>
                  <th className="px-3 py-4">Recipient Info</th>
                  <th className="px-3 py-4">Item & Dimensions</th>
                  <th className="px-3 py-4">Billing & COD</th>
                  <th className="px-3 py-4 text-center">Status</th>
                  <th className="px-3 py-4 text-center">Act</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.id} className={`transition-all ${row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/30'}`}>
                    <td className="px-3 py-3 text-center align-top pt-5">
                       <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} className="accent-sky-600" />
                    </td>
                    <td className="px-3 py-3 align-top pt-5">
                      <div className="font-mono text-xs font-bold text-slate-700">{row.mainWayId}</div>
                      <button onClick={() => addRow(row.mainWayId)} className="text-[10px] text-sky-600 font-bold mt-1">+ Add to this batch</button>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs font-bold text-sky-700 align-top pt-5">{row.subWayId}</td>
                    
                    {/* Sender Group - Uses Autocomplete */}
                    <td className="px-3 py-3 space-y-2 min-w-[220px] align-top">
                      <AutocompleteInput
                        value={row.senderPhone}
                        onChange={(v) => patchRow(row.id, "senderPhone", v)}
                        onSelectSuggestion={(item) => applyHistoricalData(row.id, "sender", item)}
                        data={HISTORICAL_CUSTOMERS}
                        extractLabel={(item) => item.phone}
                        placeholder="Phone * (Type to search history)"
                        className={`h-8 w-full rounded border px-2 text-xs outline-none ${!row.senderPhone ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}
                        renderSuggestion={(item) => (
                           <div><span className="font-bold">{item.phone}</span> - {item.name} <br/><span className="text-[10px] text-slate-500">{item.township}</span></div>
                        )}
                      />
                      <AutocompleteInput
                        value={row.senderName}
                        onChange={(v) => patchRow(row.id, "senderName", v)}
                        onSelectSuggestion={(item) => applyHistoricalData(row.id, "sender", item)}
                        data={HISTORICAL_CUSTOMERS}
                        extractLabel={(item) => item.name}
                        placeholder="Name *"
                        className={`h-8 w-full rounded border px-2 text-xs outline-none ${!row.senderName ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}
                        renderSuggestion={(item) => (
                           <div><span className="font-bold">{item.name}</span> ({item.phone}) <br/><span className="text-[10px] text-slate-500">{item.township}</span></div>
                        )}
                      />
                      <textarea placeholder="Address *" value={row.senderAddress} onChange={(e) => patchRow(row.id, "senderAddress", e.target.value)} rows={2} className={`w-full rounded border px-2 py-1 text-xs outline-none resize-none ${!row.senderAddress ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`} />
                    </td>

                    {/* Recipient Group - Uses Autocomplete */}
                    <td className="px-3 py-3 space-y-2 min-w-[220px] align-top">
                      <AutocompleteInput
                        value={row.recipientPhone}
                        onChange={(v) => patchRow(row.id, "recipientPhone", v)}
                        onSelectSuggestion={(item) => applyHistoricalData(row.id, "recipient", item)}
                        data={HISTORICAL_CUSTOMERS}
                        extractLabel={(item) => item.phone}
                        placeholder="Phone * (Type to search)"
                        className={`h-8 w-full rounded border px-2 text-xs outline-none ${!row.recipientPhone ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}
                        renderSuggestion={(item) => (
                           <div><span className="font-bold">{item.phone}</span> - {item.name} <br/><span className="text-[10px] text-slate-500">{item.township}</span></div>
                        )}
                      />
                      <input placeholder="Name *" value={row.recipientName} onChange={(e) => patchRow(row.id, "recipientName", e.target.value)} className={`h-8 w-full rounded border px-2 text-xs outline-none ${!row.recipientName ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`} />
                      <AutocompleteInput
                        value={row.recipientTownship}
                        onChange={(v) => patchRow(row.id, "recipientTownship", v)}
                        data={MYANMAR_TOWNSHIPS}
                        extractLabel={(item) => item}
                        placeholder="Township * (Type to search)"
                        className={`h-8 w-full rounded border px-2 text-xs outline-none ${!row.recipientTownship ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}
                      />
                      <textarea placeholder="Address *" value={row.recipientAddress} onChange={(e) => patchRow(row.id, "recipientAddress", e.target.value)} rows={2} className={`w-full rounded border px-2 py-1 text-xs outline-none resize-none ${!row.recipientAddress ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`} />
                    </td>

                    {/* Parcel Group */}
                    <td className="px-3 py-3 space-y-2 min-w-[180px] align-top">
                      <input placeholder="Item Name *" value={row.itemName} onChange={(e) => patchRow(row.id, "itemName", e.target.value)} className={`h-8 w-full rounded border px-2 text-xs outline-none ${!row.itemName ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`} />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">Qty:</span>
                        <input type="number" value={row.qty} onChange={(e) => patchRow(row.id, "qty", Number(e.target.value))} className="h-8 w-16 rounded border border-slate-200 px-2 text-xs outline-none" />
                        <span className="text-[10px] text-slate-500">Wt(kg):</span>
                        <input type="number" step="0.1" value={row.weightKg} onChange={(e) => patchRow(row.id, "weightKg", Number(e.target.value))} className="h-8 w-16 rounded border border-slate-200 px-2 text-xs outline-none" />
                      </div>
                      <input placeholder="Internal Note" value={row.note} onChange={(e) => patchRow(row.id, "note", e.target.value)} className="h-8 w-full rounded border border-slate-200 px-2 text-xs outline-none" />
                    </td>

                    {/* Billing Group */}
                    <td className="px-3 py-3 space-y-2 min-w-[200px] align-top">
                      <div className="flex items-center gap-2">
                        <select value={row.paymentTerm} onChange={(e) => patchRow(row.id, "paymentTerm", e.target.value)} className="h-8 w-full rounded border border-slate-200 px-2 text-[11px] font-bold outline-none bg-slate-50">
                          <option value="COD">COD</option>
                          <option value="PREPAID">Prepaid</option>
                          <option value="ACCOUNT">Account</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] w-14 text-slate-500">Del Fee:</span>
                         <input type="number" value={row.deliveryFee} onChange={(e) => patchRow(row.id, "deliveryFee", Number(e.target.value))} className="h-8 w-full rounded border border-slate-200 px-2 text-xs outline-none text-right" />
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] w-14 text-rose-500">Surcharge:</span>
                         <input type="number" value={row.extraWeightCharge} onChange={(e) => patchRow(row.id, "extraWeightCharge", Number(e.target.value))} className="h-8 w-full rounded border border-rose-100 px-2 text-xs outline-none text-right" />
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] w-14 text-emerald-600 font-bold">COD:</span>
                         <input type="number" value={row.codAmount} onChange={(e) => patchRow(row.id, "codAmount", Number(e.target.value))} className={`h-8 w-full rounded border px-2 text-xs outline-none text-right font-bold ${row.paymentTerm === 'COD' && row.codAmount <= 0 ? 'border-rose-400 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`} />
                      </div>
                    </td>

                    <td className="px-3 py-3 text-center align-top pt-5">
                       {row.isValid 
                         ? <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">Valid</span>
                         : <span className="inline-flex rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black text-rose-700">Incomplete</span>
                       }
                    </td>

                    <td className="px-3 py-3 text-center align-top pt-3">
                      <button onClick={() => removeRow(row.id)} className="rounded p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}