import * as XLSX from 'xlsx';
import type { Business } from '../types';
import { EXCEL_COLUMNS } from '../types';

const HEADER_MAP: Record<string, string> = {
  location: 'Location',
  subLocation: 'Sub Location',
  category: 'Category',
  subCategory: 'Sub Category',
  businessName: 'Business Name',
  contactNumber: 'Contact Number',
  address: 'Address',
  messageLink: 'Message Link (YouTube/Facebook)',
  postersLink: 'Posters Link (GIF/Image URL)',
  createdAt: 'Added On',
};

/** Download businesses as Excel (no images) */
export const downloadBusinessesAsExcel = (
  businesses: Business[],
  filename = 'karimnagar_businesses.xlsx'
) => {
  const rows = businesses.map((b) => {
    const row: Record<string, unknown> = {};
    EXCEL_COLUMNS.forEach((col) => {
      const val = (b as unknown as Record<string, unknown>)[col as string];
      row[HEADER_MAP[col as string] || (col as string)] =
        Array.isArray(val) ? val.join(', ') : (val ?? '');
    });
    return row;
  });

  const headers = EXCEL_COLUMNS.map((c) => HEADER_MAP[c as string] || (c as string));
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Businesses');

  // Column widths
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));

  XLSX.writeFile(wb, filename);
};

/** Download blank template */
export const downloadExcelTemplate = () => {
  const sample: Record<string, string> = {
    'Location': 'Karimnagar',
    'Sub Location': 'Mukarampura',
    'Category': 'Restaurant & Food',
    'Sub Category': 'Fast Food',
    'Business Name': 'Sample Business Name',
    'Contact Number': '9876543210',
    'Address': '123 Main Road, Near Bus Stand',
    'Message Link (YouTube/Facebook)': 'https://youtube.com/watch?v=example',
    'Posters Link (GIF/Image URL)': 'https://example.com/poster.jpg',
    'Added On': new Date().toISOString(),
  };

  const headers = EXCEL_COLUMNS.map((c) => HEADER_MAP[c as string] || (c as string));
  const ws = XLSX.utils.json_to_sheet([sample], { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Businesses');
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 22) }));
  XLSX.writeFile(wb, 'business_import_template.xlsx');
};

/** Parse uploaded Excel file into Business[] */
export const parseExcelFile = (file: File): Promise<Business[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        // Build reverse map: header label → field key
        const reverseMap: Record<string, string> = {};
        Object.entries(HEADER_MAP).forEach(([key, label]) => {
          reverseMap[label] = key;
          reverseMap[key] = key; // also accept raw field names
        });

        const businesses: Business[] = rows
          .map((row) => {
            const b: Partial<Business> = {};
            Object.entries(row).forEach(([col, val]) => {
              const field = reverseMap[col.trim()];
              if (field && val !== undefined && val !== '') {
                (b as Record<string, unknown>)[field] = String(val).trim();
              }
            });
            return b as Business;
          })
          .filter((b) => b.businessName && b.contactNumber);

        resolve(businesses);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
