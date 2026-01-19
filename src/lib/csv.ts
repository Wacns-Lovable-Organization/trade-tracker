// CSV utilities for import/export

export interface CsvInventoryEntry {
  item_name: string;
  category: string;
  quantity: number;
  unit_cost: number;
  currency: string;
  notes: string;
  bought_at: string;
}

export interface CsvSaleRecord {
  item_name: string;
  quantity_sold: number;
  sale_price: number;
  currency: string;
  notes: string;
  sold_at: string;
}

// Convert array of objects to CSV string
export function toCSV<T extends Record<string, unknown>>(data: T[], headers?: string[]): string {
  if (data.length === 0) return '';
  
  const keys = headers || Object.keys(data[0]);
  const csvHeaders = keys.join(',');
  
  const rows = data.map(row => 
    keys.map(key => {
      const value = row[key];
      // Handle strings with commas, quotes, or newlines
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }
      return String(value ?? '');
    }).join(',')
  );
  
  return [csvHeaders, ...rows].join('\n');
}

// Parse CSV string to array of objects
export function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Parse headers
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const data: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index].trim();
      });
      data.push(row as T);
    }
  }
  
  return data;
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  values.push(current);
  
  return values;
}

// Download CSV file
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Generate sample CSV template
export function getInventoryCSVTemplate(): string {
  const headers = ['item_name', 'category', 'quantity', 'unit_cost', 'currency', 'notes', 'bought_at'];
  const sample = {
    item_name: 'Example Item',
    category: 'Other',
    quantity: '10',
    unit_cost: '5',
    currency: 'WL',
    notes: 'Optional notes',
    bought_at: new Date().toISOString().split('T')[0],
  };
  return toCSV([sample], headers);
}

export function getSalesCSVTemplate(): string {
  const headers = ['item_name', 'quantity_sold', 'sale_price', 'currency', 'notes', 'sold_at'];
  const sample = {
    item_name: 'Example Item',
    quantity_sold: '5',
    sale_price: '50',
    currency: 'WL',
    notes: 'Optional notes',
    sold_at: new Date().toISOString().split('T')[0],
  };
  return toCSV([sample], headers);
}
