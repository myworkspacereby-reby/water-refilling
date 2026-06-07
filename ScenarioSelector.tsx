import { MOCK_SCENARIOS } from "../utils/scenarios";
import { MockScenario } from "../types";
import { HelpCircle, Check } from "lucide-react";

interface ScenarioSelectorProps {
  onSelect: (scenario: MockScenario) => void;
  selectedTitle: string;
}

export default function ScenarioSelector({ onSelect, selectedTitle }: ScenarioSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider font-mono">
          <HelpCircle className="w-4 h-4 text-blue-500" /> Choose Audit Quick Scenarios
        </h3>
        <span className="text-xs text-slate-400 italic">Click one to pre-fill form fields</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MOCK_SCENARIOS.map((scenario) => {
          const isSelected = selectedTitle === scenario.title;
          
          let borderClass = "border-slate-200 hover:border-blue-300 hover:shadow-sm";
          let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
          
          if (isSelected) {
            borderClass = "border-blue-500 ring-2 ring-blue-500/5 bg-blue-50/10";
          }

          if (scenario.category === "leakage") {
            badgeClass = "bg-red-50 text-red-700 border-red-200";
          } else if (scenario.category === "discrepancy") {
            badgeClass = "bg-amber-50 text-amber-700 border-amber-250";
          } else {
            badgeClass = "bg-slate-100 text-slate-700 border-slate-250";
          }

          return (
            <button
              key={scenario.title}
              type="button"
              onClick={() => onSelect(scenario)}
              className={`text-left p-3.5 rounded-xl border text-sm transition-all duration-200 flex flex-col justify-between h-full bg-white relative cursor-pointer ${borderClass}`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 bg-blue-500 text-white rounded-full p-0.5">
                  <Check className="w-3 h-3" />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${badgeClass}`}>
                    {scenario.category}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 leading-tight pr-4">
                  {scenario.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  {scenario.description}
                </p>
              </div>

              <div className="mt-3.5 pt-2 border-t border-slate-100 w-full flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono text-slate-500">
                  Meter Variance: {scenario.meter_closing - scenario.meter_opening > 0 ? `+${(scenario.meter_closing - scenario.meter_opening).toFixed(1)}m³` : "0m³"}
                </span>
                <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-0.5">
                  Load Entry &rarr;
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
