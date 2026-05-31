/**
 * CSV Data Loading and Normalization Service
 * 
 * Loads the Washington State vendor payment CSV from public/data/,
 * normalizes raw rows into a consistent payment record format,
 * and filters out invalid entries (zero or negative amounts).
 * 
 * This is the single point of entry for CSV parsing and data preparation.
 */

import Papa from "papaparse";
import type { PaymentRow, RawPaymentRow } from "../types/payment";

/**
 * Convert a string or number value to a number, handling comma-separated formats.
 * Returns 0 if the value is undefined, null, or cannot be parsed.
 */
function toNumber(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  return Number(String(value).replace(/,/g, "")) || 0;
}

/**
 * Transform a raw CSV row into a normalized PaymentRow.
 * Ensures all fields have consistent types and handles missing fields with defaults.
 */
export function normalizeRow(row: RawPaymentRow): PaymentRow {
  return {
    biennium: row.Bien || "",
    fiscalYear: toNumber(row.FY),
    fiscalMonth: toNumber(row.FMonth),
    agencyCode: row.Agy || "",
    agency: row.Agency || "Unknown Agency",
    category: row.Category || "Uncategorized",
    subCategory: row.SubCategory || "Unknown Subcategory",
    vendor: row.Vendor || "Unknown Vendor",
    amount: toNumber(row.Amount),
  };
}

/**
 * Load and parse the Washington State vendor payments CSV file.
 * Filters out rows with zero or negative amounts to ensure data quality.
 * 
 * @returns Promise resolving to the array of normalized payment records
 * @throws Error if the CSV file cannot be loaded or parsed
 */
export async function loadPayments(): Promise<PaymentRow[]> {
  const response = await fetch("/data/Vendor-Payments_2021-23(FY 2022).csv");

  if (!response.ok) {
    throw new Error("Could not load CSV file.");
  }

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<RawPaymentRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data
          .map(normalizeRow)
          .filter((row) => row.amount > 0);

        resolve(rows);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}