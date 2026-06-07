import { ShieldCheck, RefreshCw } from "lucide-react";

interface HeaderProps {
  onResetApp: () => void;
  isProcessing: boolean;
}

export default function Header({ onResetApp, isProcessing }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-blue-500/30 text-white px-8 h-16 flex items-center justify-between shadow-lg z-10 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-sky-300 text-slate-950 rounded-lg flex items-center justify-center font-black text-xs shadow-md">
          H2O
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-bold tracking-tight text-white uppercase font-mono">
              Water Refilling Station
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onResetApp}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
            Reset Audit
          </button>
        </div>
      </div>
    </header>
  );
}
