import { useState, useEffect } from "react";
import { AuditRecord, CustomerBreakdown } from "../types";
import { motion } from "motion/react";
import { 
  DollarSign, 
  Droplet, 
  Scale, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Save, 
  Plus, 
  Trash2, 
  Edit,
  ClipboardList
} from "lucide-react";

interface ReportViewerProps {
  audit: Omit<AuditRecord, "id" | "created_at"> & { id?: string };
  onSave: (finalAudit: AuditRecord) => void;
  isSaving: boolean;
  historyRecords?: AuditRecord[];
  onSelectRecord?: (record: AuditRecord) => void;
}

export default function ReportViewer({ 
  audit, 
  onSave, 
  isSaving,
  historyRecords = [],
  onSelectRecord
}: ReportViewerProps) {
  const [actualCash, setActualCash] = useState<string>("");
  const [userNote, setUserNote] = useState<string>("");
  const [editedAudit, setEditedAudit] = useState<any>(null);
  const [isEditingGrid, setIsEditingGrid] = useState(false);

  // When a new audit is generated or loaded, sync state
  useEffect(() => {
    setEditedAudit(JSON.parse(JSON.stringify(audit)));
    const cashVal = audit.actual_cash_collected !== undefined 
      ? audit.actual_cash_collected 
      : audit.financial_summary.grand_total_cash_expected;
    setActualCash(cashVal.toString());
    setUserNote(audit.notes || "");
  }, [audit]);

  if (!editedAudit) return null;

  // Destructure for quick metrics
  const { date, meter_reading, financial_summary, customer_breakdown, audit_errors_or_notes } = editedAudit;

  // Aggregate all unique dates in the system dynamically and sort descending (newest first)
  const allDates = Array.from(new Set([
    date,
    ...(historyRecords || []).map((r: any) => r.date)
  ])).filter(Boolean).sort((a, b) => b.localeCompare(a));

  const totalGallonsExpected = meter_reading.total_consumed_m3 * 264.17;
  const recordedGallons = financial_summary.total_gallons_sold;
  
  // Calculate raw water loss percentage:
  let waterLossPercent = 0;
  if (totalGallonsExpected > 0) {
    waterLossPercent = 100 - (recordedGallons / totalGallonsExpected) * 100;
  }

  // Cash Calculations
  const expectedCashTotal = financial_summary.grand_total_cash_expected;
  const actualCashNum = parseFloat(actualCash) || 0;
  const cashVariance = actualCashNum - expectedCashTotal;



  // Allow inline editing of audit factors for flexibility
  const handleUpdateMeter = (field: "opening" | "closing", val: number) => {
    const nextVal = isNaN(val) ? 0 : val;
    const nextMeter = { ...editedAudit.meter_reading, [field]: nextVal };
    nextMeter.total_consumed_m3 = parseFloat((nextMeter.closing - nextMeter.opening).toFixed(2));
    
    setEditedAudit({
      ...editedAudit,
      meter_reading: nextMeter
    });
  };

  const handleUpdateCustomer = (index: number, field: keyof CustomerBreakdown, value: any) => {
    const list = [...editedAudit.customer_breakdown];
    list[index] = { ...list[index], [value === "" ? "" : value]: value };
    
    if (field === "gallons" || field === "total_paid" || field === "inferred_rate_per_gallon") {
      const parsedVal = parseFloat(value) || 0;
      list[index][field] = parsedVal as never;
    } else {
      list[index][field] = value as never;
    }

    // Recalculate totals
    let newTotalGallons = 0;
    let newPureWater = 0;
    let newMisc = 0;

    list.forEach(item => {
      const gall = item.gallons || 0;
      const rate = item.inferred_rate_per_gallon || 25;
      const paid = item.total_paid || 0;
      
      const baseCost = gall * rate;
      newTotalGallons += gall;
      
      if (paid > baseCost) {
        newPureWater += baseCost;
        newMisc += (paid - baseCost);
      } else {
        newPureWater += paid; // They paid less than standard rate
      }
    });

    const expectedCash = newPureWater + newMisc;

    setEditedAudit({
      ...editedAudit,
      customer_breakdown: list,
      financial_summary: {
        total_gallons_sold: newTotalGallons,
        pure_water_sales: newPureWater,
        miscellaneous_revenue: newMisc,
        grand_total_cash_expected: expectedCash
      }
    });
  };

  const deleteCustomerItem = (index: number) => {
    const list = editedAudit.customer_breakdown.filter((_: any, i: number) => i !== index);
    
    // Recalculate components
    let newTotalGallons = 0;
    let newPureWater = 0;
    let newMisc = 0;

    list.forEach((item: any) => {
      const gall = item.gallons || 0;
      const rate = item.inferred_rate_per_gallon || 25;
      const paid = item.total_paid || 0;
      
      const baseCost = gall * rate;
      newTotalGallons += gall;
      
      if (paid > baseCost) {
        newPureWater += baseCost;
        newMisc += (paid - baseCost);
      } else {
        newPureWater += paid;
      }
    });

    const expectedCash = newPureWater + newMisc;

    setEditedAudit({
      ...editedAudit,
      customer_breakdown: list,
      financial_summary: {
        total_gallons_sold: newTotalGallons,
        pure_water_sales: newPureWater,
        miscellaneous_revenue: newMisc,
        grand_total_cash_expected: expectedCash
      }
    });
  };

  const addCustomerItem = () => {
    const list = [...editedAudit.customer_breakdown, { name: "New Client", gallons: 5, total_paid: 125, inferred_rate_per_gallon: 25 }];
    setEditedAudit({
      ...editedAudit,
      customer_breakdown: list
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-500 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-905 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Financial Audit & Reconciliation Report
            </h2>
            <p className="text-[11px] text-blue-100 font-mono">
              Audit Date: {date || "N/A"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => setIsEditingGrid(!isEditingGrid)}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
              isEditingGrid 
                ? "bg-amber-500 text-white hover:bg-amber-600" 
                : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
            {isEditingGrid ? "Disable Log Editor" : "Enable Manual Override"}
          </button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        {/* Core Meter Metrics & Water Loss */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Consumption (m³)</span>
              <Droplet className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2.5">
              {isEditingGrid ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    className="w-16 border rounded text-xs p-1 font-mono text-center"
                    value={meter_reading.opening}
                    onChange={(e) => handleUpdateMeter("opening", parseFloat(e.target.value))}
                    placeholder="Open"
                    title="Opening Meter"
                  />
                  <span className="text-xs text-slate-400">&rarr;</span>
                  <input
                    type="number"
                    step="0.1"
                    className="w-16 border rounded text-xs p-1 font-mono text-center"
                    value={meter_reading.closing}
                    onChange={(e) => handleUpdateMeter("closing", parseFloat(e.target.value))}
                    placeholder="Close"
                    title="Closing Meter"
                  />
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight text-slate-800">
                    {meter_reading.total_consumed_m3.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">cubic meters</span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-between border-t border-slate-200/60 pt-1.5">
              <span>Opening: {meter_reading.opening.toFixed(1)} m³</span>
              <span>Closing: {meter_reading.closing.toFixed(1)} m³</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Gallons Sold</span>
              <Scale className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-slate-800">
                {recordedGallons}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">gallons</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 font-mono border-t border-slate-200/60 pt-1.5">
              Equivalent output: {(recordedGallons / 264.17).toFixed(2)} m³
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Water Loss Audit</span>
              <TrendingDown className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight text-slate-800">
                  {waterLossPercent.toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-500 font-mono">estimated loss</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 font-mono border-t border-slate-200/60 pt-1.5 flex items-center justify-between">
              <span>Expected: {totalGallonsExpected.toFixed(0)} gallons</span>
              <span>Sold: {recordedGallons} gallons</span>
            </div>
          </div>
        </div>

        {/* Customer Breakdown Grid */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-blue-500" /> Customer Transaction breakdown Log
            </h4>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Simple Date Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 px-2 font-mono">
                <span className="text-[10px] uppercase font-bold text-slate-500">Date Filter:</span>
                <select
                  value={date}
                  onChange={(e) => {
                    if (onSelectRecord && historyRecords) {
                      const found = historyRecords.find(r => r.date === e.target.value);
                      if (found) onSelectRecord(found);
                    }
                  }}
                  className="bg-transparent border-0 text-[11px] text-slate-705 font-bold focus:outline-none cursor-pointer"
                >
                  {allDates.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {isEditingGrid && (
                <button
                  type="button"
                  onClick={addCustomerItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded px-2.5 py-1 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Row
                </button>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[9px] tracking-wider">
                  <th className="py-2.5 px-3">Name / Entity</th>
                  <th className="py-2.5 px-3 text-center">Gallons</th>
                  <th className="py-2.5 px-3 text-center">Applied Rate</th>
                  <th className="py-2.5 px-3 text-right">Cash Paid</th>
                  {isEditingGrid && <th className="py-2.5 px-3 text-center w-12">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                {customer_breakdown.map((customer: CustomerBreakdown, idx: number) => {
                  const baseExpected = customer.gallons * customer.inferred_rate_per_gallon;
                  const miscExceeded = customer.total_paid - baseExpected;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {isEditingGrid ? (
                          <input
                            type="text"
                            className="border rounded text-xs p-1 w-full"
                            value={customer.name}
                            onChange={(e) => handleUpdateCustomer(idx, "name", e.target.value)}
                          />
                        ) : (
                          customer.name
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {isEditingGrid ? (
                          <input
                            type="number"
                            className="border rounded text-xs p-1 w-12 text-center"
                            value={customer.gallons}
                            onChange={(e) => handleUpdateCustomer(idx, "gallons", e.target.value)}
                          />
                        ) : (
                          `${customer.gallons} gal`
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {isEditingGrid ? (
                          <select
                            className="border rounded text-xs p-1"
                            value={customer.inferred_rate_per_gallon}
                            onChange={(e) => handleUpdateCustomer(idx, "inferred_rate_per_gallon", parseInt(e.target.value))}
                          >
                            <option value={20}>₱20 (Wholesale)</option>
                            <option value={25}>₱25 (Retail)</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            customer.inferred_rate_per_gallon === 20 
                              ? "bg-slate-100 text-slate-700 border-slate-200" 
                              : "bg-teal-50 text-teal-700 border-teal-200"
                          }`}>
                            ₱{customer.inferred_rate_per_gallon}/gal
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {isEditingGrid ? (
                          <input
                            type="number"
                            className="border rounded text-xs p-1 w-20 text-right"
                            value={customer.total_paid}
                            onChange={(e) => handleUpdateCustomer(idx, "total_paid", e.target.value)}
                          />
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-slate-800">₱{customer.total_paid.toLocaleString()}</span>
                            {miscExceeded > 0 && (
                              <span className="text-[10px] text-indigo-600 font-medium">
                                (+₱{miscExceeded} Misc fee)
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      {isEditingGrid && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteCustomerItem(idx)}
                            disabled={customer_breakdown.length <= 1}
                            className="text-rose-500 hover:text-rose-700 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger & Ledger Balancing */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-700 rounded-xl p-5 text-white shadow-lg flex flex-col gap-4 border border-slate-900">
          <div className="border-b border-white/15 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-sky-100">
              AUDITED CASHIER DRAWER BALANCING & RECONCILIATION
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-1">
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-100 font-mono font-medium">Pure Water Sales</span>
              <span className="text-lg font-bold text-white font-mono">₱{financial_summary.pure_water_sales.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-sky-100 font-mono font-medium">Miscellaneous Revenue</span>
              <span className="text-lg font-bold text-sky-200 font-mono">+₱{financial_summary.miscellaneous_revenue.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-emerald-200 font-mono font-medium">EXPECTED CASH TOTAL</span>
              <span className="text-xl font-black text-emerald-350 font-mono">₱{expectedCashTotal.toLocaleString()}</span>
            </div>
            
            {/* Cash in hand input of registry */}
            <div className="flex flex-col">
              <label className="text-[10px] text-sky-100 font-mono flex items-center gap-0.5 uppercase font-medium">
                Actual Cash Collected
              </label>
              <div className="relative mt-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-blue-200 font-mono">₱</span>
                <input
                  type="number"
                  className="bg-white/10 border border-white/20 focus:border-white/40 w-full rounded px-2.5 pl-6 py-1 text-xs text-white text-right font-mono outline-none"
                  placeholder="Drawer Amount"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Variance Status Warning banner */}
          <div className="mt-1">
            {cashVariance === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs flex items-center justify-between text-emerald-400">
                <span className="flex items-center gap-1.5 font-sans font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Cash matches expected sales perfectly.
                </span>
                <span className="font-mono font-bold">Variance: ₱0</span>
              </div>
            ) : cashVariance > 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs flex items-center justify-between text-amber-400">
                <span className="flex items-center gap-1.5 font-sans font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Cash drawer has an overage (extra money).
                </span>
                <span className="font-mono font-bold">+₱{cashVariance.toLocaleString()}</span>
              </div>
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-xs flex items-center justify-between text-rose-400">
                <span className="flex items-center gap-1.5 font-sans font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Cash drawer is short (missing money).
                </span>
                <span className="font-mono font-bold">-₱{Math.abs(cashVariance).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Confirm & Complete Audit Footer Banner section */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
          <div className="space-y-1 max-w-md">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              Ledger Settlement Pending
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Verify flow margins and cashier balances above. Confirming will write this day's audited metrics to the historical log database.
            </p>
          </div>

          <button
            onClick={() => {
              const finalRecord: AuditRecord = {
                ...editedAudit,
                id: audit.id || `audit-${Date.now()}`,
                actual_cash_collected: actualCashNum,
                notes: userNote,
                created_at: (audit as any).created_at || new Date().toISOString()
              };
              onSave(finalRecord);
            }}
            disabled={isSaving}
            className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 hover:text-emerald-300 font-extrabold text-white text-xs px-6 py-4 rounded-xl shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Confirm & Save Audit
          </button>
        </div>

      </div>
    </motion.div>
  );
}
