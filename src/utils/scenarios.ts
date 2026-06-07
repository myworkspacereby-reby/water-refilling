import { MockScenario } from "../../types";

export const MOCK_SCENARIOS: MockScenario[] = [
  {
    title: "Scenario A: Standard Clean Record",
    description: "Typical, well-documented day with standard pricing model, matching water flow meter variance (8% washing waste).",
    category: "standard",
    meter_opening: 12450.5,
    meter_closing: 12453.8,
    raw_text: `June 5, 2026 - H2O Pure Refilling Station
Meter Open: 12450.5
Meter Close: 12453.8

Sales logs:
1. Barangay Hall: 40 gallons @ Wholesale rate 20 -> Paid P800
2. Aling Nena Retail: 8 Gallons -> Paid P200 (at Retail rate 25)
3. J&M Laundry: 150 gallons @ Bulk rate 20 -> Paid P3000
4. Mang Jose Delivery: 12 gallons Retail -> Paid P300
5. Ryan G.: 50 Gallons Wholesale -> Paid P1000

Total reported sales: 260 gallons.
Cashier Drawer: P5300 expected.`
  },
  {
    title: "Scenario B: Pricing Variances & Containers",
    description: "Detects underpayments, isolates a ₱200 slim blue container fee, and tracks delivery surcharges into Miscellaneous revenue.",
    category: "discrepancy",
    meter_opening: 12453.8,
    meter_closing: 12455.5,
    raw_text: `June 6, 2026 Refill Log
Opening Water Meter: 12453.8
Closing Water Meter: 12455.5

Daily Customer Logs:
- Cardo Dalisay: 5 gallons water + 1 New slim container (P200) -> Paid P300 total
- Sarah G.: 20 Gallons Retail. Paid P500.
- Baby Ruth: 2 Gallons Retail. Paid P40.
- South Cafe Bulk: 300 Gallons Bulk rate. Paid P6000.
- Delivery Boy Kiko: 10 Gallons Retail + Delivery Surcharge (P50) -> Paid P300.`
  },
  {
    title: "Scenario C: Critical Alarm (Leaking/Theft)",
    description: "Highlights a huge water meter consumption (6.7 m3 used) contrasting with only 100 gallons logged. Flags a 94.3% audit alarm.",
    category: "leakage",
    meter_opening: 12455.5,
    meter_closing: 12462.2,
    raw_text: `June 7, 2026 Leakage Disaster Log
Open meter: 12455.5
Close meter: 12462.2

Logged transactions (Shift B):
- Tita Vicky: 40 gallons Bulk @ 20 -> Paid P800
- Kuya Bok: 60 gallons Retail @ 25 -> Paid P1500

Cashier notes: Shift ended early. Total cash P2300.`
  }
];
