export type RawPaymentRow = {
  Bien: string;
  FY: string;
  FMonth: string;
  Agy: string;
  Agency: string;
  Object: string;
  Category: string;
  Subobj: string;
  SubCategory: string;
  Vendor: string;
  Amount: string;
};

export type PaymentRow = {
  biennium: string;
  fiscalYear: number;
  fiscalMonth: number;
  agencyCode: string;
  agency: string;
  category: string;
  subCategory: string;
  vendor: string;
  amount: number;
};

export type ChartItem = {
  name: string;
  value: number;
};

export type Insight = {
  id: string;
  title: string;
  label: string;
  value: string;
  description: string;
  whyItMatters: string;
  data: ChartItem[];
};