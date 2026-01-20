import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { CurrencyUnit } from '@/types/inventory';

interface InventoryReportData {
  items: {
    name: string;
    category: string;
    remainingQty: number;
    totalCost: number;
    currency: CurrencyUnit;
  }[];
  totalValue: Record<CurrencyUnit, number>;
  generatedAt: Date;
}

interface SalesReportData {
  sales: {
    date: string;
    item: string;
    quantity: number;
    revenue: number;
    profit: number;
    currency: CurrencyUnit;
  }[];
  totals: {
    revenue: Record<CurrencyUnit, number>;
    profit: Record<CurrencyUnit, number>;
  };
  period: { start: Date; end: Date };
  generatedAt: Date;
}

interface ProfitReportData {
  summary: {
    totalRevenue: Record<CurrencyUnit, number>;
    totalCost: Record<CurrencyUnit, number>;
    totalProfit: Record<CurrencyUnit, number>;
    profitMargin: number;
  };
  topItems: {
    name: string;
    profit: number;
    currency: CurrencyUnit;
  }[];
  expenses: {
    category: string;
    amount: number;
    currency: string;
  }[];
  period: { start: Date; end: Date };
  generatedAt: Date;
}

const formatCurrency = (amount: number, currency: CurrencyUnit | string) => {
  return `${amount.toLocaleString()} ${currency}`;
};

export function generateInventoryReport(data: InventoryReportData): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Inventory Status Report', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${format(data.generatedAt, 'PPpp')}`, 14, 30);
  
  // Summary
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Total Inventory Value:', 14, 42);
  
  let yOffset = 48;
  Object.entries(data.totalValue).forEach(([currency, value]) => {
    if (value > 0) {
      doc.text(`${formatCurrency(value, currency as CurrencyUnit)}`, 20, yOffset);
      yOffset += 6;
    }
  });
  
  // Table
  autoTable(doc, {
    startY: yOffset + 10,
    head: [['Item', 'Category', 'Qty', 'Value']],
    body: data.items.map(item => [
      item.name,
      item.category,
      item.remainingQty.toString(),
      formatCurrency(item.totalCost, item.currency),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 139, 202] },
  });
  
  doc.save(`inventory-report-${format(data.generatedAt, 'yyyy-MM-dd')}.pdf`);
}

export function generateSalesReport(data: SalesReportData): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Sales Summary Report', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Period: ${format(data.period.start, 'PP')} - ${format(data.period.end, 'PP')}`, 14, 30);
  doc.text(`Generated: ${format(data.generatedAt, 'PPpp')}`, 14, 36);
  
  // Summary
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Totals:', 14, 48);
  
  let yOffset = 54;
  Object.entries(data.totals.revenue).forEach(([currency, value]) => {
    if (value > 0) {
      const profit = data.totals.profit[currency as CurrencyUnit] || 0;
      doc.text(`Revenue: ${formatCurrency(value, currency)} | Profit: ${formatCurrency(profit, currency)}`, 20, yOffset);
      yOffset += 6;
    }
  });
  
  // Table
  autoTable(doc, {
    startY: yOffset + 10,
    head: [['Date', 'Item', 'Qty', 'Revenue', 'Profit']],
    body: data.sales.map(sale => [
      format(new Date(sale.date), 'PP'),
      sale.item,
      sale.quantity.toString(),
      formatCurrency(sale.revenue, sale.currency),
      formatCurrency(sale.profit, sale.currency),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [92, 184, 92] },
  });
  
  doc.save(`sales-report-${format(data.generatedAt, 'yyyy-MM-dd')}.pdf`);
}

export function generateProfitReport(data: ProfitReportData): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Profit Analysis Report', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Period: ${format(data.period.start, 'PP')} - ${format(data.period.end, 'PP')}`, 14, 30);
  doc.text(`Generated: ${format(data.generatedAt, 'PPpp')}`, 14, 36);
  
  // Summary
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Financial Summary', 14, 50);
  
  let yOffset = 58;
  Object.entries(data.summary.totalRevenue).forEach(([currency, revenue]) => {
    if (revenue > 0) {
      const cost = data.summary.totalCost[currency as CurrencyUnit] || 0;
      const profit = data.summary.totalProfit[currency as CurrencyUnit] || 0;
      
      doc.setFontSize(10);
      doc.text(`${currency}:`, 20, yOffset);
      doc.text(`Revenue: ${formatCurrency(revenue, currency)}`, 40, yOffset);
      doc.text(`Cost: ${formatCurrency(cost, currency)}`, 90, yOffset);
      doc.text(`Profit: ${formatCurrency(profit, currency)}`, 140, yOffset);
      yOffset += 6;
    }
  });
  
  doc.setFontSize(11);
  doc.text(`Overall Profit Margin: ${data.summary.profitMargin.toFixed(1)}%`, 20, yOffset + 4);
  
  // Top Performers
  if (data.topItems.length > 0) {
    doc.setFontSize(14);
    doc.text('Top Performing Items', 14, yOffset + 18);
    
    autoTable(doc, {
      startY: yOffset + 24,
      head: [['Item', 'Profit']],
      body: data.topItems.map(item => [
        item.name,
        formatCurrency(item.profit, item.currency),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 173, 78] },
    });
  }
  
  // Expenses
  if (data.expenses.length > 0) {
    const docWithAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
    const finalY = docWithAutoTable.lastAutoTable?.finalY || yOffset + 60;
    
    doc.setFontSize(14);
    doc.text('Expenses Breakdown', 14, finalY + 14);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Category', 'Amount']],
      body: data.expenses.map(exp => [
        exp.category,
        formatCurrency(exp.amount, exp.currency),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [217, 83, 79] },
    });
  }
  
  doc.save(`profit-report-${format(data.generatedAt, 'yyyy-MM-dd')}.pdf`);
}
