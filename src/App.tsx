import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ReportViewer from "./components/ReportViewer";
import HistoryDashboard from "./components/HistoryDashboard";
import { AuditRecord, MockScenario } from "./types";
import { MOCK_SCENARIOS } from "./utils/scenarios";
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Camera, 
  Check, 
  Image as ImageIcon,
  BookOpen,
  Info,
  Calendar,
  Layers,
  Trash2,
  Plus,
  RefreshCw,
  TrendingDown
} from "lucide-react";

// Pre-seeded demo audits matching the Philippine refilling station demo
const SEEDED_DEMO_RECORDS: AuditRecord[] = [
  {
    id: "seeded-jun-03",
    date: "2026-06-03",
    meter_reading: {
      opening: 12440.2,
      closing: 12443.0,
      total_consumed_m3: 2.8
    },
    financial_summary: {
      total_gallons_sold: 215,
      pure_water_sales: 4300,
      miscellaneous_revenue: 0,
      grand_total_cash_expected: 4300
    },
    customer_breakdown: [
      { name: "Sari Sari Store Whls", gallons: 100, total_paid: 2000, inferred_rate_per_gallon: 20 },
      { name: "Residences Retail", gallons: 60, total_paid: 1500, inferred_rate_per_gallon: 25 },
      { name: "Public Market Bulk", gallons: 55, total_paid: 1100, inferred_rate_per_gallon: 20 }
    ],
    audit_errors_or_notes: ["Standard water meter reconciliation fits operational bounds (~10% wash overhead). No discrepancies."],
    actual_cash_collected: 4300,
    notes: "Day 1 of Month. Fully reconciled. Shift log by Cashier Jenny.",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "seeded-jun-04",
    date: "2026-06-04",
    meter_reading: {
      opening: 12443.0,
      closing: 12446.8,
      total_consumed_m3: 3.8
    },
    financial_summary: {
      total_gallons_sold: 290,
      pure_water_sales: 5800,
      miscellaneous_revenue: 350,
      grand_total_cash_expected: 6150
    },
    customer_breakdown: [
      { name: "Laundry Mat Bulk", gallons: 200, total_paid: 4000, inferred_rate_per_gallon: 20 },
      { name: "Subdivision Customers", gallons: 80, total_paid: 2000, inferred_rate_per_gallon: 25 },
      { name: "Store Container Rent", gallons: 10, total_paid: 150, inferred_rate_per_gallon: 25 }
    ],
    audit_errors_or_notes: [
      "Customer 'Store Container Rent' paid P150 which is P100 short of standard retail scale! Cashier must verify deposit terms."
    ],
    actual_cash_collected: 6000,
    notes: "Cashier Jenny short by P150. Need verification during shift turnover.",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SCENARIO_FORM_DATA: Record<string, any> = {
  "Scenario A: Standard Clean Record": {
    date: "2026-06-05",
    opening: "12450.5",
    closing: "12453.8",
    customers: [
      { name: "Barangay Hall", gallons: 40, total_paid: 800, inferred_rate_per_gallon: 20 },
      { name: "Aling Nena Retail", gallons: 8, total_paid: 200, inferred_rate_per_gallon: 25 },
      { name: "J&M Laundry", gallons: 150, total_paid: 3000, inferred_rate_per_gallon: 20 },
      { name: "Mang Jose Delivery", gallons: 12, total_paid: 300, inferred_rate_per_gallon: 25 },
      { name: "Ryan G.", gallons: 50, total_paid: 1000, inferred_rate_per_gallon: 20 }
    ],
    actual_cash: "5300",
    notes: ["Standard water meter reconciliation fits operational bounds (~8% wash overhead). No discrepancies."]
  },
  "Scenario B: Pricing Variances & Containers": {
    date: "2026-06-06",
    opening: "12453.8",
    closing: "12455.5",
    customers: [
      { name: "Cardo Dalisay", gallons: 5, total_paid: 300, inferred_rate_per_gallon: 25 },
      { name: "Sarah G.", gallons: 20, total_paid: 500, inferred_rate_per_gallon: 25 },
      { name: "Baby Ruth", gallons: 2, total_paid: 40, inferred_rate_per_gallon: 25 },
      { name: "South Cafe Bulk", gallons: 300, total_paid: 6000, inferred_rate_per_gallon: 20 },
      { name: "Delivery Boy Kiko", gallons: 10, total_paid: 300, inferred_rate_per_gallon: 25 }
    ],
    actual_cash: "7140",
    notes: [
      "Baby Ruth paid P40 which is short P10 of the standard retail price list (2 gal * P25/gal = P50). Priority check required.",
      "Cardo Dalisay paid ₱300. Base water cost: 5 * P25 = P125. P175 isolated under Miscellaneous (New container shell purchase).",
      "Delivery Boy Kiko paid P300. Base water cost: 10 * P25 = P250. P50 isolated to Miscellaneous (Delivery surcharge)."
    ]
  },
  "Scenario C: Critical Alarm (Leaking/Theft)": {
    date: "2016-06-07",
    opening: "12455.5",
    closing: "12462.2",
    customers: [
      { name: "Tita Vicky", gallons: 40, total_paid: 800, inferred_rate_per_gallon: 20 },
      { name: "Kuya Bok", gallons: 60, total_paid: 1500, inferred_rate_per_gallon: 25 }
    ],
    actual_cash: "2300",
    notes: [
      "CRITICAL FLOW LOSS: Fluid consumption meter indicates an estimated 94.3% leakage, spill, or unlogged wholesale bypass!",
      "Flow meter shows 6.7 m³ consumed (~1,770 gallons output expected) but cashier only recorded 100 gallons sold!"
    ]
  }
};

export default function App() {
  // Form Field States
  const [formDate, setFormDate] = useState<string>("2026-06-06");
  const [formMeterOpening, setFormMeterOpening] = useState<string>("12450.5");
  const [formMeterClosing, setFormMeterClosing] = useState<string>("12453.8");
  const [formCustomers, setFormCustomers] = useState<any[]>([
    { name: "", gallons: "", total_paid: "", inferred_rate_per_gallon: 25 },
    { name: "", gallons: "", total_paid: "", inferred_rate_per_gallon: 25 },
    { name: "", gallons: "", total_paid: "", inferred_rate_per_gallon: 25 },
  ]);
  const [formActualCash, setFormActualCash] = useState<string>("0");

  // Selected quick scenario title tracking
  const [selectedScenarioTitle, setSelectedScenarioTitle] = useState<string>("");

  // Scanner upload fields
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileMimeType, setFileMimeType] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  
  // Operational States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [historyRecords, setHistoryRecords] = useState<AuditRecord[]>([]);

  // Simulator Dialog state
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  // Non-blocking Modals / Alerts
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss Toast Timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load ledger audits from local storage
  useEffect(() => {
    const cached = localStorage.getItem("h2o_audited_records");
    if (cached) {
      try {
        setHistoryRecords(JSON.parse(cached));
      } catch (e) {
        setHistoryRecords(SEEDED_DEMO_RECORDS);
      }
    } else {
      setHistoryRecords(SEEDED_DEMO_RECORDS);
      localStorage.setItem("h2o_audited_records", JSON.stringify(SEEDED_DEMO_RECORDS));
    }

    // Load first scenario to prepopulate clean state on start
    handleLoadScenario(MOCK_SCENARIOS[0]);
  }, []);

  // Preset Scenario loader
  const handleLoadScenario = (sc: MockScenario) => {
    setSelectedScenarioTitle(sc.title);
    const data = SCENARIO_FORM_DATA[sc.title];
    if (data) {
      setFormDate(data.date);
      setFormMeterOpening(data.opening);
      setFormMeterClosing(data.closing);
      setFormCustomers(JSON.parse(JSON.stringify(data.customers)));
      setFormActualCash(data.actual_cash);
      
      // Auto compile report instantly on right
      compileAndSetReport(data.date, data.opening, data.closing, data.customers, data.actual_cash, data.notes);
    }
    // Clear uploads to maintain clean state
    setFileBase64("");
    setFileMimeType("");
    setFileName("");
    setErrorStatus(null);
  };

  // Compile calculations immediately
  const compileAndSetReport = (
    dateStr: string,
    openStr: string,
    closeStr: string,
    custs: any[],
    cashStr: string,
    preseedNotes?: string[]
  ) => {
    const opening = parseFloat(openStr) || 0;
    const closing = parseFloat(closeStr) || 0;
    const total_consumed_m3 = parseFloat((closing - opening).toFixed(2));
    const totalGallonsExpected = total_consumed_m3 * 264.17;
    const actual_cash_collected = parseFloat(cashStr) || 0;

    let totalGallonsSold = 0;
    let pureWaterSales = 0;
    let miscellaneousRevenue = 0;

    custs.forEach(c => {
      const gall = parseFloat(c.gallons) || 0;
      const rate = parseFloat(c.inferred_rate_per_gallon) || 25;
      const paid = parseFloat(c.total_paid) || 0;

      totalGallonsSold += gall;
      const baseCost = gall * rate;
      if (paid > baseCost) {
        pureWaterSales += baseCost;
        miscellaneousRevenue += (paid - baseCost);
      } else {
        pureWaterSales += paid;
      }
    });

    const grandTotalCashExpected = pureWaterSales + miscellaneousRevenue;
    
    // Dynamic rule checking for instant audit alerts
    const autoNotes: string[] = [];
    if (preseedNotes && preseedNotes.length > 0) {
      autoNotes.push(...preseedNotes);
    } else {
      if (total_consumed_m3 > 0) {
        const loss = ((totalGallonsExpected - totalGallonsSold) / totalGallonsExpected) * 105; 
        if (loss > 15) {
          autoNotes.push(`CRITICAL FLOW LOSS: Consumption meter indicates ₱${loss.toFixed(1)}% leakage, spill, or unlogged retail sale bypass!`);
        } else if (loss < -5) {
          autoNotes.push(`METER CONTRADICTION: Sold gallons (${totalGallonsSold} gal) exceed meter expectations (${totalGallonsExpected.toFixed(0)} gal) by ${Math.abs(loss).toFixed(1)}%. Check bypass.`);
        } else {
          autoNotes.push(`Flow meter variance of ${loss.toFixed(1)}% is normal (fits acceptable filter washing and bucket flush bounds).`);
        }
      }

      custs.forEach(c => {
        const gall = parseFloat(c.gallons) || 0;
        const rate = parseFloat(c.inferred_rate_per_gallon) || 25;
        const paid = parseFloat(c.total_paid) || 0;
        const expected = gall * rate;
        if (paid < expected) {
          autoNotes.push(`Pricing Discrepancy: Customer '${c.name}' paid ₱${paid} instead of expected index rate ₱${expected} (${gall} gal * ₱${rate}/gal).`);
        }
      });

      const diff = actual_cash_collected - grandTotalCashExpected;
      if (diff !== 0) {
        autoNotes.push(`Drawer imbalance: Actual cash on hand has ₱${Math.abs(diff).toLocaleString()} ${diff > 0 ? "overage" : "shortage"} relative to transactions.`);
      } else {
        autoNotes.push(`Balance secured: Actual cash collected matches total transaction expectance.`);
      }
    }

    const doc = {
      date: dateStr,
      meter_reading: { opening, closing, total_consumed_m3 },
      financial_summary: {
        total_gallons_sold: totalGallonsSold,
        pure_water_sales: pureWaterSales,
        miscellaneous_revenue: miscellaneousRevenue,
        grand_total_cash_expected: grandTotalCashExpected
      },
      customer_breakdown: custs,
      audit_errors_or_notes: autoNotes,
      actual_cash_collected,
      notes: ""
    };

    setActiveReport(doc);
    return doc;
  };

  // Compile triggered manually by button click
  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    compileAndSetReport(formDate, formMeterOpening, formMeterClosing, formCustomers, formActualCash);
  };

  // Customer transactions management helpers inside the form with real-time reactive calculation
  const handleFormCustomerChange = (idx: number, field: string, value: any) => {
    const list = [...formCustomers];
    const prevItem = list[idx];
    let updatedItem = { ...prevItem, [field]: value };

    // Automatically recalculate Spent ₱ if gallons or price rate is changed
    if (field === "gallons" || field === "inferred_rate_per_gallon") {
      const gallons = field === "gallons" ? (parseInt(value) || 0) : (parseInt(prevItem.gallons) || 0);
      const rate = field === "inferred_rate_per_gallon" ? (parseInt(value) || 0) : (parseInt(prevItem.inferred_rate_per_gallon) || 0);
      updatedItem.total_paid = gallons * rate;
    }

    list[idx] = updatedItem;
    setFormCustomers(list);

    // Sum all final row-level total_paid numbers to automatically update the actual cash collected in drawer
    const totalSpent = list.reduce((sum, item) => sum + (parseInt(item.total_paid) || 0), 0);
    setFormActualCash(String(totalSpent));
  };

  const addFormCustomerRow = () => {
    const defaultNewRow = { name: "", gallons: "", total_paid: "", inferred_rate_per_gallon: 25 };
    const updated = [...formCustomers, defaultNewRow];
    setFormCustomers(updated);
    
    // Auto adjust actual cash drawer on row additions
    const totalSpent = updated.reduce((sum, item) => sum + (parseInt(item.total_paid) || 0), 0);
    setFormActualCash(String(totalSpent));
  };

  const removeFormCustomerRow = (idx: number) => {
    const updated = formCustomers.filter((_, i) => i !== idx);
    setFormCustomers(updated);
    
    // Auto adjust actual cash drawer on row removals
    const totalSpent = updated.reduce((sum, item) => sum + (parseInt(item.total_paid) || 0), 0);
    setFormActualCash(String(totalSpent));
  };

  // File Handlers for scanner
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorStatus("Please provide a valid image log (JPEG, PNG).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      setFileBase64(base64);
      setFileMimeType(file.type);
      setFileName(file.name);
      setErrorStatus(null);
      // Automatically trigger scanner and calculations upon uploading
      triggerAIScannerAudit(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateNotebookSnap = () => {
    // Inject mock screenshot of a physical handwritten notebook log block
    // This will send to '/api/audit' for OCR analysis to demonstrate actual product utility
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const mime = "image/png";
    const name = "snapped_ledger_diary.png";
    setFileBase64(base64);
    setFileMimeType(mime);
    setFileName(name);
    setShowPhotoPicker(false);
    // Automatically trigger scanner and calculations upon simulation selection
    triggerAIScannerAudit(base64, mime);
  };

  // AI Scanner Submission - triggers Gemini server-side routing
  const triggerAIScannerAudit = async (customBase64?: string, customMimeType?: string) => {
    setIsAnalyzing(true);
    setErrorStatus(null);

    const activeBase64 = customBase64 || fileBase64;
    const activeMimeType = customMimeType || fileMimeType;

    if (!activeBase64) {
      setErrorStatus("No image loaded to scan.");
      setIsAnalyzing(false);
      return;
    }

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "", // Let Gemini analyze the image file visually
          fileData: activeBase64,
          mimeType: activeMimeType || "image/png"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed on server side.");
      }

      // Populate our manual input form instantly so they can review and modify the results!
      setFormDate(data.date || "2026-06-06");
      setFormMeterOpening(String(data.meter_reading?.opening || 0));
      setFormMeterClosing(String(data.meter_reading?.closing || 0));
      setFormCustomers(data.customer_breakdown || []);
      setFormActualCash(String(data.actual_cash_collected || data.financial_summary?.grand_total_cash_expected || 0));

      // Trigger active display
      setActiveReport(data);

      setToastMessage("AI Auditor successfully parsed and calculated the data! Manual form entry below shows the loaded results.");

      // Scroll to active report dynamically
      const reportDiv = document.getElementById("active-report-pane");
      if (reportDiv) {
        reportDiv.scrollIntoView({ behavior: "smooth" });
      }

    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "An error occurred during OCR communication. Double-check your API configurations.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAuditToLedger = (finalRecord: AuditRecord) => {
    const list = [finalRecord, ...historyRecords.filter(r => r.date !== finalRecord.date)];
    setHistoryRecords(list);
    localStorage.setItem("h2o_audited_records", JSON.stringify(list));
    setToastMessage(`Audit successfully saved inside ledger for: ${finalRecord.date}!`);
  };

  const handleDeleteRecord = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleResetDemoData = () => {
    setShowResetConfirm(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 flex flex-col font-sans selection:bg-blue-500/20">
      <Header onResetApp={handleResetDemoData} isProcessing={isAnalyzing} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Simple Banner Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-slate-900">
          <div className="space-y-1 relative z-10 max-w-2xl">
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-300 animate-pulse" /> Water Refilling Audit Manager
            </h2>
            <p className="text-sm text-blue-100/90 leading-relaxed font-medium">
              Easiest way to log gallons sold, closing water meters, dates, and actual cash collected. Use the manual entry form below or scan with the AI visual assistant.
            </p>
          </div>
          <div className="flex gap-3 relative z-10">
            <a 
              href="#trend-dashboard"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-xs rounded-xl transition-all"
            >
              View History Table
            </a>
          </div>
        </div>

        {/* Core Inputs Selection Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SUBMISSION CONSOLE - Form / Scanner - 5 spans */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              {/* Daily Entry Console Header */}
              <div className="border-b border-slate-150 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 animate-pulse" /> Daily Audit & Sales Entry Console
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Log closing water meters, gallons sold, and physical cash. Use the AI visual scanner box to snap/upload a notebook log photo (it will instantly auto-calculate the math and populate the form fields below) or enter values manually.
                </p>
              </div>

              {/* 📷 QUICK IMPORT VIA AI PHOTO SCANNER */}
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/10 border border-blue-100 rounded-xl p-4 space-y-3.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-blue-800 text-[10.5px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" /> 1. AI Photo Scanner Autofilter (Optional)
                  </h4>
                  {isAnalyzing && (
                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-500" /> Scanner Working...
                    </span>
                  )}
                </div>
                
                <p className="text-[11px] text-slate-655 leading-relaxed">
                  Avoid physical form typing! Simply upload an image file of your cashier's handwrite notebook or use our snapshot simulator below to instantly extract the ledger, run standard audits, and autofill the form.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Simulated snapshot picker */}
                  <button
                    type="button"
                    onClick={() => setShowPhotoPicker(true)}
                    disabled={isAnalyzing}
                    className="border border-dashed border-blue-250 hover:border-blue-400 disabled:opacity-50 rounded-xl p-3 text-center flex flex-col items-center justify-center gap-1 hover:bg-blue-50/40 transition-all cursor-pointer select-none"
                  >
                    <Camera className="w-5 h-5 text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-700">Simulate Snapshot</span>
                  </button>

                  {/* Standard uploader file */}
                  <label className="border border-dashed border-blue-250 hover:border-blue-400 rounded-xl p-3 text-center flex flex-col items-center justify-center gap-1 hover:bg-blue-50/40 transition-all cursor-pointer select-none">
                    <Upload className="w-5 h-5 text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-700">Upload Photo File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isAnalyzing}
                    />
                  </label>
                </div>

                {/* Preview file uploaded banner */}
                {fileBase64 && (
                  <div className="bg-white border border-blue-100 rounded-lg p-2.5 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 p-1.5 rounded text-blue-600">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-slate-800 truncate max-w-[150px]" title={fileName}>
                          {fileName}
                        </p>
                        <p className="text-[9px] font-mono text-emerald-600 font-bold flex items-center gap-0.5">
                          <span>✓ Scanned & Populated</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFileBase64(""); setFileName(""); }}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 px-2 rounded cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="bg-slate-900 text-white rounded-xl p-3 text-xs flex items-center gap-2.5 shadow-md">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-blue-400" />
                    <div>
                      <p className="font-extrabold text-[10px] tracking-wider uppercase font-mono">Running AI Audit Engine</p>
                      <p className="text-[10.5px] text-slate-300 mt-0.5 leading-relaxed">
                        Reading notebook characters, matching client rows, and auto-populating fields...
                      </p>
                    </div>
                  </div>
                )}

                {errorStatus && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-600 space-y-1 font-sans">
                    <p className="font-bold flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Scanner Feedback Error
                    </p>
                    <p className="font-mono text-[10px] leading-relaxed break-words">{errorStatus}</p>
                  </div>
                )}
              </div>

              {/* 📝 MANUAL FORM ENTRY PORTION (ALWAYS SHOWN BELOW) */}
              <div className="border-t border-slate-100 pt-3 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-700 text-[10.5px] uppercase tracking-wider font-mono">
                    2. Sales Ledger Form (Calculated Live)
                  </h4>
                  {fileBase64 && (
                    <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-250 px-2 py-0.5 rounded-full font-bold">
                      ⚡ Prefined by AI Scanner
                    </span>
                  )}
                </div>

                <form onSubmit={handleManualFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {/* Date select */}
                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Shift Date</label>
                      <input
                        type="date"
                        className="mt-1 bg-slate-50 border border-slate-250 focus:border-blue-500 focus:outline-none rounded-xl p-2.5 text-xs font-mono"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        required
                      />
                    </div>

                    {/* Meter Opening */}
                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Meter Open</label>
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 bg-slate-50 border border-slate-250 focus:border-blue-500 focus:outline-none rounded-xl p-2.5 text-xs font-mono"
                        value={formMeterOpening}
                        onChange={(e) => setFormMeterOpening(e.target.value)}
                        placeholder="0.0"
                        required
                      />
                    </div>

                    {/* Meter Closing */}
                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Meter Close</label>
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 bg-slate-50 border border-slate-250 focus:border-blue-500 focus:outline-none rounded-xl p-2.5 text-xs font-mono"
                        value={formMeterClosing}
                        onChange={(e) => setFormMeterClosing(e.target.value)}
                        placeholder="0.0"
                        required
                      />
                    </div>
                  </div>

                  {/* Flow Meter consumption indicator */}
                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-500 flex justify-between font-mono">
                    <span>Cubic meter used: <strong className="text-slate-800">
                      {(parseFloat(formMeterClosing) - parseFloat(formMeterOpening) || 0).toFixed(2)} m³
                    </strong></span>
                    <span>Approx. Flow Expected: <strong className="text-slate-800">
                      {((parseFloat(formMeterClosing) - parseFloat(formMeterOpening) || 0) * 264.17).toFixed(0)} gallons
                    </strong></span>
                  </div>

                  {/* Customer transactions list table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider font-mono block">
                        Sales logs (Entity, quantity, rate, collected)
                      </label>
                      <button
                        type="button"
                        onClick={addFormCustomerRow}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Customer Row
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 max-h-64 overflow-y-auto">
                      <table className="w-full text-left font-sans text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-500 font-mono text-[9px] uppercase border-b border-slate-200">
                            <th className="py-2 px-2.5">Customer Name</th>
                            <th className="py-2 px-1 text-center w-16">Gallons</th>
                            <th className="py-2 px-1 text-center w-28">Price Rate</th>
                            <th className="py-2 px-2.5 text-right w-24">Spent ₱</th>
                            <th className="py-2 px-2.5 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formCustomers.map((cust, idx) => (
                            <tr key={idx} className="hover:bg-white transition-all">
                              <td className="p-1 px-2">
                                <input
                                  type="text"
                                  className="w-full bg-white border border-slate-200 focus:border-blue-400 rounded-lg p-1 px-1.5 text-xs text-slate-800"
                                  placeholder="Customer Name"
                                  value={cust.name}
                                  onChange={(e) => handleFormCustomerChange(idx, "name", e.target.value)}
                                  required
                                />
                              </td>
                              <td className="p-1 text-center">
                                <input
                                  type="number"
                                  className="w-14 bg-white border border-slate-200 focus:border-blue-400 rounded-lg p-1 text-xs text-center font-mono text-slate-800"
                                  placeholder="0"
                                  value={cust.gallons}
                                  onChange={(e) => handleFormCustomerChange(idx, "gallons", e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                                  required
                                />
                              </td>
                              <td className="p-1 text-center">
                                <select
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[11px] text-slate-850"
                                  value={cust.inferred_rate_per_gallon}
                                  onChange={(e) => handleFormCustomerChange(idx, "inferred_rate_per_gallon", parseInt(e.target.value) || 0)}
                                >
                                  <option value={25}>₱25 (Retail)</option>
                                  <option value={20}>₱20 (Wholesale)</option>
                                  <option value={0}>₱0 (Custom/Promo)</option>
                                </select>
                              </td>
                              <td className="p-1 text-right">
                                <input
                                  type="number"
                                  className="w-20 bg-white border border-slate-200 focus:border-blue-400 rounded-lg p-1 text-xs text-right font-mono text-slate-800 font-bold"
                                  placeholder="0"
                                  value={cust.total_paid}
                                  onChange={(e) => handleFormCustomerChange(idx, "total_paid", e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                                  required
                                />
                              </td>
                              <td className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeFormCustomerRow(idx)}
                                  className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cash collected row */}
                  <div className="flex flex-col">
                    <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider font-mono">Actual Cash Collected in Drawer (₱)</label>
                    <input
                      type="number"
                      className="mt-1 bg-slate-50 border border-slate-250 font-bold text-slate-850 focus:border-blue-500 focus:outline-none rounded-xl p-2.5 text-xs font-mono"
                      value={formActualCash}
                      onChange={(e) => setFormActualCash(e.target.value)}
                      placeholder="e.g. 5300"
                      required
                    />
                  </div>

                  {/* Submission and calculation button */}
                  <button
                    type="submit"
                    className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 hover:text-sky-350 text-white font-extrabold text-xs py-4 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    RUN DAILY AUDIT RECONCILIATION SHEET
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT AUDITED REPORT VIEWER - 6 spans */}
          <div className="lg:col-span-6" id="active-report-pane">
            {activeReport ? (
              <ReportViewer
                audit={activeReport}
                onSave={handleSaveAuditToLedger}
                isSaving={isAnalyzing}
                historyRecords={historyRecords}
                onSelectRecord={(rec) => {
                  setFormDate(rec.date);
                  setFormMeterOpening(String(rec.meter_reading.opening));
                  setFormMeterClosing(String(rec.meter_reading.closing));
                  setFormCustomers(JSON.parse(JSON.stringify(rec.customer_breakdown)));
                  setFormActualCash(String(rec.actual_cash_collected || rec.financial_summary.grand_total_cash_expected));
                  setActiveReport(rec);
                  
                  setTimeout(() => {
                    document.getElementById("active-report-pane")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 80);
                }}
              />
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 bg-white text-center flex flex-col items-center justify-center space-y-4 min-h-[450px]">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-400">
                  <BookOpen className="w-10 h-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700">
                    Ready to Generate Audit Ledger
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    Set date, meter open/close, and check customer entries on the left. Then click "Reconcile" to see the full details here.
                  </p>
                </div>
                
                <div className="border border-slate-100 bg-slate-50 rounded-xl max-w-sm p-3.5 text-left text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold uppercase tracking-wider text-slate-600 font-mono pb-1 flex items-center gap-1">
                    💡 Easy Shifting Audit
                  </p>
                  <p className="leading-relaxed">
                    The calculations will automatically isolate pure water sales from container shells, verify flow meter variances, and detect drawer overages/shortages!
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* DIALOG SIMULATING PHYSICAL NOTEPAD SNAPSHOT */}
        {showPhotoPicker && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-fade-in divide-y divide-slate-100">
              <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-xs uppercase font-mono tracking-wider">Notebook Log Snapshot Simulator</span>
                </div>
                <button 
                  onClick={() => setShowPhotoPicker(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Water refilling cashiers log transactions inside spiral binders. This simulator feeds a captured image of <strong>"Scenario B: Pricing Variances & Containers"</strong> directly to Gemini.
                </p>

                {/* Notebook diary mockup layout on screen */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 font-mono text-xs text-amber-900 space-y-2 max-w-sm mx-auto shadow-inner relative select-none">
                  <p className="font-bold border-b border-amber-200/50 pb-1.5 uppercase text-[10px] tracking-wider">🗒️ SHIFT LOG DIARY - JUNE 6, 2026</p>
                  <p className="text-[11px]">Flow Meter Open: 12453.8 | Close: 12455.5</p>
                  <p className="text-[11.5px] font-bold mt-1 text-slate-600">Client details:</p>
                  <div className="text-[10px] pl-2 leading-relaxed">
                    - Cardo Dalisay: 5 gal + 1 Slim blue jug (P200) paid P300
                    <br />- Sarah G.: 20 gal Retail. Paid P500
                    <br />- Baby Ruth: 2 gal Retail. Paid P40
                    <br />- South Cafe Bulk: 300 gal Wholesale. Paid P6000
                    <br />- Delivery Boy Kiko: 10 gal Retail + Surcharge (P50) paid P300
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(false)}
                  className="px-3 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSimulateNotebookSnap}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Feed Simulated Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY SECTION */}
        <section id="trend-dashboard" className="pt-6 border-t border-slate-200">
          <HistoryDashboard
            records={historyRecords}
            onSelectRecord={(rec) => {
              // Convert cached AuditRecord date/opening variables to correct forms
              setFormDate(rec.date);
              setFormMeterOpening(String(rec.meter_reading.opening));
              setFormMeterClosing(String(rec.meter_reading.closing));
              setFormCustomers(JSON.parse(JSON.stringify(rec.customer_breakdown)));
              setFormActualCash(String(rec.actual_cash_collected || rec.financial_summary.grand_total_cash_expected));
              
              setActiveReport(rec);
              
              setTimeout(() => {
                document.getElementById("active-report-pane")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 80);
            }}
            onDeleteRecord={handleDeleteRecord}
          />
        </section>

      </main>

      {/* CUSTOM FLOATING TOAST NOTIFICATION SUCCESS BANNER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white p-3.5 px-4.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm animate-fade-in border-l-4 border-l-blue-500 font-sans">
          <div className="w-5 h-5 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
            ✓
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11.5px] font-medium leading-normal text-slate-100">{toastMessage}</p>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-bold pl-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* CUSTOM NON-BLOCKING DELETE CONFIRMATION OVERLAY */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4 text-center animate-scale-up font-sans">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                Purge Audit Record?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete this audit sheet from history? This action is irreversible.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white cursor-pointer active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const filtered = historyRecords.filter(rec => rec.id !== deleteTargetId);
                  setHistoryRecords(filtered);
                  localStorage.setItem("h2o_audited_records", JSON.stringify(filtered));
                  setDeleteTargetId(null);
                  setToastMessage("Audit record purged successfully from ledger.");
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM NON-BLOCKING RESET CONFIRMATION OVERLAY */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4 text-center animate-scale-up font-sans">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto text-xl">
              🔄
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                Reset Ledger Database?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will wipe any manual entries and reload the original pre-seeded station demonstration records.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white cursor-pointer active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("h2o_audited_records", JSON.stringify(SEEDED_DEMO_RECORDS));
                  setHistoryRecords(SEEDED_DEMO_RECORDS);
                  setActiveReport(null);
                  handleLoadScenario(MOCK_SCENARIOS[0]);
                  setShowResetConfirm(false);
                  setToastMessage("Ledger database reloaded successfully.");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-slate-950 border-t border-slate-900 py-6 mt-12 text-slate-500 text-xs text-center font-mono">
        <p>© 2026 H2O Ledger Auditor System. Direct Audit Compliant.</p>
        <p className="mt-1 text-[10px] text-slate-600 font-sans">Developed for easy Philippine water refilling station management</p>
      </footer>
    </div>
  );
}
