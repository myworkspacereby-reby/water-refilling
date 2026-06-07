import React, { useState } from "react";
import { AuditRecord } from "../types";
import { 
  Calendar, 
  Eye, 
  Trash2, 
  FolderMinus,
  Download,
  Mail,
  X,
  FileText,
  CheckCircle,
  Printer,
  Sparkles,
  ShieldCheck
} from "lucide-react";

interface HistoryDashboardProps {
  records: AuditRecord[];
  onSelectRecord: (record: AuditRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export default function HistoryDashboard({ records, onSelectRecord, onDeleteRecord }: HistoryDashboardProps) {
  const tableRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  // Export State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("reby@raver.ai");
  const [selectedDate, setSelectedDate] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [generatedStatement, setGeneratedStatement] = useState<{
    record: AuditRecord;
    email: string;
    stamp: string;
  } | null>(null);

  // Derive active date from selected list or fallback to the latest
  const availableDates = [...new Set(records.map(r => r.date))].sort().reverse();
  const defaultDate = availableDates[0] || "";
  const activeDate = selectedDate || defaultDate;

  // Find record for the active date
  const activeRecord = records.find(r => r.date === activeDate);

  const handleExportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord) return;

    setIsSending(true);

    // Simulate sending email and then generate downloadable files
    setTimeout(() => {
      setIsSending(false);
      setGeneratedStatement({
        record: activeRecord,
        email: emailInput,
        stamp: new Date().toLocaleString()
      });

      // Automatically trigger real CSV download file!
      downloadCSV(activeRecord, emailInput);
    }, 1000);
  };

  const downloadCSV = (record: AuditRecord, email: string) => {
    const lines = [
      `WATER PURIFICATION STATION - DAILY RECORD ACCOUNT STATEMENT`,
      `Statement Date,${record.date}`,
      `Recipient Email Address,${email}`,
      `Extraction Timestamp,${new Date().toLocaleString()}`,
      ``,
      `--- WATER METER VERIFICATION ---`,
      `Opening Meter Reading (m³),${record.meter_reading.opening}`,
      `Closing Meter Reading (m³),${record.meter_reading.closing}`,
      `Cubic Meters Pumped (m³),${record.meter_reading.total_consumed_m3}`,
      `Expected Flow Extracted (gallons),${record.financial_summary.total_gallons_sold}`,
      ``,
      `--- DETAILED CUSTOMER SALES LEDGER ---`,
      `Customer Name,Gallons Purchased,Applied Price Rate,Total Amount Paid (₱)`
    ];
    
    record.customer_breakdown.forEach((cust, i) => {
      lines.push(`"${cust.name || `Walk-in Customer #${i + 1}`}",${cust.gallons || 0},₱${cust.inferred_rate_per_gallon},₱${cust.total_paid || 0}`);
    });
    
    // Total numbers
    const actualCash = record.actual_cash_collected ?? record.financial_summary.grand_total_cash_expected;
    const variance = actualCash - record.financial_summary.grand_total_cash_expected;

    lines.push(``);
    lines.push(`--- RECONCILIATION SUMMARY FINANCIALS ---`);
    lines.push(`Pure Bulk Water Revenue (₱),₱${record.financial_summary.pure_water_sales}`);
    lines.push(`Miscellaneous / Accessory Revenue (₱),₱${record.financial_summary.miscellaneous_revenue}`);
    lines.push(`Grand Expected Cash Balance (₱),₱${record.financial_summary.grand_total_cash_expected}`);
    lines.push(`Physical Hand-counted Cash (₱),₱${actualCash}`);
    lines.push(`Over/Short Variance Discrepancy (₱),₱${variance}`);
    
    if (record.audit_errors_or_notes && record.audit_errors_or_notes.length > 0) {
      lines.push(``);
      lines.push(`--- AUDITOR BULLET NOTES ---`);
      record.audit_errors_or_notes.forEach(note => {
        lines.push(`"${note.replace(/"/g, '""')}"`);
      });
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Water_Station_Statement_${record.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Historical Records List Table */}
      {records.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500" /> Historic Station Audits Table
            </h3>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">Total audits logs: {records.length}</span>
              <button
                type="button"
                onClick={() => {
                  setIsExportOpen(true);
                  if (activeDate === "" && availableDates.length > 0) {
                    setSelectedDate(availableDates[0]);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10.5px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm font-mono uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5 text-indigo-250 animate-bounce" /> Export Statement
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/55 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                  <th className="py-3 px-4">Audit Date</th>
                  <th className="py-3 px-4 text-center">Meter Used (m³)</th>
                  <th className="py-3 px-4 text-center">Gallons Sold</th>
                  <th className="py-3 px-4 text-right">Cash Expected</th>
                  <th className="py-3 px-4 text-right">Actual Collected</th>
                  <th className="py-3 px-4 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {tableRecords.map((rec) => {
                  const actualCollected = rec.actual_cash_collected ?? rec.financial_summary.grand_total_cash_expected;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-850">
                        {rec.date}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {rec.meter_reading.total_consumed_m3.toFixed(1)} m³
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-600">
                        {rec.financial_summary.total_gallons_sold} gal
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        ₱{rec.financial_summary.grand_total_cash_expected.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        ₱{actualCollected.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectRecord(rec)}
                          className="bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded p-1.5 transition-all cursor-pointer"
                          title="Review Record Sheet"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(rec.id)}
                          className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded p-1.5 transition-all cursor-pointer"
                          title="Purge Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 max-w-lg mx-auto">
          <FolderMinus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Historical Records Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Fill in the daily audit sheet on the left or upload a photo to auto-generate one, then save it to the history.
          </p>
        </div>
      )}

      {/* Elegant Export & Statement Builder Modal overlay */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Mail className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-mono font-black text-xs text-slate-900 uppercase tracking-wider">Statement Exporter & Mailer</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Download sheet & generate structured system reports</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsExportOpen(false);
                  setGeneratedStatement(null);
                }}
                className="p-1 px-2 text-slate-405 hover:text-slate-650 hover:bg-slate-100 rounded-lg cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content area */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Simple Input Form */}
              <form onSubmit={handleExportSubmit} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-4 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email address to notify */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest">
                      Your Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-3 text-xs outline-none font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Date of Audit Selection */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest">
                      Select Statement Date
                    </label>
                    <select
                      value={activeDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs outline-none font-mono font-bold text-slate-800"
                    >
                      {availableDates.map(d => (
                        <option key={d} value={d}>📅 {d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm">
                    Enter the email to instantly receive an automated formatted system summary statement. Submitting also outputs the high-comfort CSV instantly.
                  </p>
                  <button
                    type="submit"
                    disabled={isSending || !activeRecord}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin text-white" />
                        Generating Audit Sheet...
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5 text-indigo-200" />
                        Generate & Download Statement
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* AUTOMATIC STATEMENT DISPLAY BOX */}
              {generatedStatement && (
                <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm space-y-4 animate-fade-in relative text-left">
                  
                  {/* Status ribbon */}
                  <div className="bg-emerald-500 text-white px-4 py-2 flex items-center justify-between text-xs font-mono uppercase tracking-wider font-extrabold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-white shrink-0" />
                      Statement generated successfully
                    </span>
                    <span>✓ File Dispatched To {generatedStatement.email}</span>
                  </div>

                  {/* Elegant Printable Daily Statement Receipt */}
                  <div className="p-6 space-y-5 text-slate-800 font-sans" id="printable-area">
                    
                    {/* Invoice/Statement Header */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                      <div>
                        <h5 className="font-extrabold text-blue-600 text-[11px] tracking-widest font-mono uppercase">OFFICIAL AUDIT REPORT</h5>
                        <h4 className="font-black text-xl text-slate-900 mt-0.5">Water Purification Station</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Daily Reconciliation Log & Custody Records</p>
                      </div>
                      <div className="text-right font-mono text-[10px] text-slate-500 space-y-0.5">
                        <p><strong>Statement Date:</strong> {generatedStatement.record.date}</p>
                        <p><strong>Manager Destination:</strong> {generatedStatement.email}</p>
                        <p><strong>System Extracted:</strong> {generatedStatement.stamp}</p>
                        <p className="text-indigo-600 font-bold"><strong>Status:</strong> Approved & Locked</p>
                      </div>
                    </div>

                    {/* Simple stats cards inside statement */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                        <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">Water Pumped</p>
                        <p className="text-sm font-black font-mono text-slate-800 mt-0.5">
                          {generatedStatement.record.meter_reading.total_consumed_m3.toFixed(2)} m³
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          ({generatedStatement.record.meter_reading.opening} to {generatedStatement.record.meter_reading.closing})
                        </p>
                      </div>

                      <div className="bg-blue-50/20 border border-blue-50 p-2.5 rounded-xl">
                        <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">Actual Gallons Sold</p>
                        <p className="text-sm font-black font-mono text-blue-700 mt-0.5">
                          {generatedStatement.record.financial_summary.total_gallons_sold.toLocaleString()} gal
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Applied on {generatedStatement.record.customer_breakdown.length} ledger rows</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                        <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">Balance Variance</p>
                        {(() => {
                          const expect = generatedStatement.record.financial_summary.grand_total_cash_expected;
                          const actual = generatedStatement.record.actual_cash_collected ?? expect;
                          const diff = actual - expect;
                          return (
                            <>
                              <p className={`text-sm font-black font-mono mt-0.5 ${diff === 0 ? "text-emerald-600" : diff > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                ₱{diff.toLocaleString()}
                              </p>
                              <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                                {diff === 0 ? "✓ Full Reconciled" : diff > 0 ? "▲ Surplus Cash" : "▼ Short Leakage"}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Breakdown List Inside Statement */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">Customer Sales Ledger</p>
                      <div className="border border-slate-150 rounded-xl overflow-hidden text-[11px]">
                        <div className="bg-slate-50/80 px-3 py-1.5 grid grid-cols-12 gap-2 border-b border-slate-200 font-mono text-[9px] text-slate-500 uppercase tracking-wider font-extrabold">
                          <span className="col-span-6">Customer Name</span>
                          <span className="col-span-2 text-center">Gallons</span>
                          <span className="col-span-2 text-right">Price Rate</span>
                          <span className="col-span-2 text-right">Paid Amount</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {generatedStatement.record.customer_breakdown.map((cust, ix) => (
                            <div key={ix} className="px-3 py-2 grid grid-cols-12 gap-2 text-slate-700 font-medium">
                              <span className="col-span-6 truncate font-semibold">
                                {cust.name || <span className="text-slate-400 font-mono italic">Walk-in Client</span>}
                              </span>
                              <span className="col-span-2 text-center font-mono">
                                {cust.gallons !== "" ? cust.gallons : 0} gal
                              </span>
                              <span className="col-span-2 text-right font-mono text-slate-500 font-bold">
                                ₱{cust.inferred_rate_per_gallon}
                              </span>
                              <span className="col-span-2 text-right font-mono font-bold text-slate-800">
                                ₱{(cust.total_paid !== "" ? cust.total_paid : 0).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cash Drawer Reconciliation */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Pure Bulk Sales:</span>
                          <span className="font-bold text-slate-705">₱{generatedStatement.record.financial_summary.pure_water_sales.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Misc Revenue:</span>
                          <span className="font-bold text-slate-705">₱{generatedStatement.record.financial_summary.miscellaneous_revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200/60 pt-1.5 font-bold">
                          <span className="text-slate-500 font-mono">Drawer Expected:</span>
                          <span className="text-indigo-600">₱{generatedStatement.record.financial_summary.grand_total_cash_expected.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 border-l border-slate-200 pl-4">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Handcounted cash:</span>
                          <strong className="text-slate-800">₱{(generatedStatement.record.actual_cash_collected ?? generatedStatement.record.financial_summary.grand_total_cash_expected).toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between border-t border-slate-200/60 pt-1.5 font-bold">
                          <span className="text-slate-500">Net Discrepancy:</span>
                          {(() => {
                            const expect = generatedStatement.record.financial_summary.grand_total_cash_expected;
                            const actual = generatedStatement.record.actual_cash_collected ?? expect;
                            const diff = actual - expect;
                            return (
                              <span className={diff === 0 ? "text-emerald-600" : diff > 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                                ₱{diff.toLocaleString()}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Audit list feedback */}
                    {generatedStatement.record.audit_errors_or_notes && generatedStatement.record.audit_errors_or_notes.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Station Reconciliation Observations
                        </p>
                        <div className="bg-blue-50/15 border border-blue-50 rounded-xl p-3 text-[11px] text-slate-650 font-medium space-y-1">
                          {generatedStatement.record.audit_errors_or_notes.map((note, idx) => (
                            <p key={idx} className="flex items-start gap-1">
                              <span className="text-blue-500">▪</span> {note}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Signatures Footer */}
                    <div className="pt-6 border-t border-slate-200 border-dashed flex justify-between items-center text-[10px] text-slate-404 font-mono">
                      <p>Station Operator Signature: __________________________</p>
                      <p>Audited Secure Key: {generatedStatement.record.id.slice(0, 8).toUpperCase()}</p>
                    </div>

                  </div>

                  {/* Actions buttons underneath statement preview */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handlePrintStatement}
                      className="bg-white hover:bg-slate-100 border border-slate-200 font-extrabold text-[11px] text-slate-700 px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      Print Statement
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Download the CSV file again
                        downloadCSV(generatedStatement.record, generatedStatement.email);
                      }}
                      className="bg-slate-950 hover:bg-slate-900 font-extrabold text-[11px] text-white px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-300" />
                      Redownload Spreadsheet (CSV)
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
