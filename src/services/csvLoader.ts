import Papa from "papaparse";
import type { PaymentRow, RawPaymentRow } from "../types/payment";

function toNumber(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  return Number(String(value).replace(/,/g, "")) || 0;
}

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

export async function loadPayments(): Promise<PaymentRow[]> {
  const response = await fetch("public/data/Vendor-Payments_2021-23(FY 2022).csv");

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