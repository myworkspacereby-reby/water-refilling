export interface MeterReading {
  opening: number;
  closing: number;
  total_consumed_m3: number;
}

export interface FinancialSummary {
  total_gallons_sold: number;
  pure_water_sales: number;
  miscellaneous_revenue: number;
  grand_total_cash_expected: number;
}

export interface CustomerBreakdown {
  name: string;
  gallons: number;
  total_paid: number;
  inferred_rate_per_gallon: number;
}

export interface AuditRecord {
  id: string;
  date: string;
  meter_reading: MeterReading;
  financial_summary: FinancialSummary;
  customer_breakdown: CustomerBreakdown[];
  audit_errors_or_notes: string[];
  raw_text_used?: string;
  actual_cash_collected?: number; // User input to match against drawer cash
  notes?: string;                 // Custom manager observations
  created_at: string;
}

export interface MockScenario {
  title: string;
  description: string;
  category: "standard" | "discrepancy" | "leakage";
  meter_opening: number;
  meter_closing: number;
  raw_text: string;
  imageUrl?: string;
}
