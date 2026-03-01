import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * A single row of raw, unmapped data from a parsed file.
 * Keys are the original column headers from the source file.
 */
export type RawRow = Record<string, unknown>;

/**
 * Result of parsing a file, containing the extracted rows,
 * detected headers, total row count, and optional sheet name for Excel files.
 */
export interface ParseResult {
  rows: RawRow[];
  headers: string[];
  totalRows: number;
  sheetName?: string;
}

/**
 * FileParser handles detecting file types and parsing CSV/Excel files
 * into a normalized array of row objects for downstream field mapping.
 */
export class FileParser {
  /**
   * Detect the file type from a buffer by inspecting magic bytes.
   *
   * TODO: Implement magic byte detection for XLSX (PK zip header),
   * XLS (Microsoft Compound Document), and fall back to CSV.
   *
   * @param buffer - Raw file content as a Buffer
   * @returns The detected file type
   */
  detectFileType(buffer: Buffer): 'csv' | 'xlsx' | 'xls' {
    // TODO: Check for XLSX magic bytes (PK\x03\x04 zip signature)
    // TODO: Check for XLS magic bytes (D0 CF 11 E0 compound document)
    // TODO: Default to CSV if no binary signature detected
    if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
      return 'xlsx';
    }
    if (buffer[0] === 0xd0 && buffer[1] === 0xcf) {
      return 'xls';
    }
    return 'csv';
  }

  /**
   * Parse a CSV string into an array of row objects.
   *
   * TODO: Configure Papa Parse options for:
   * - Dynamic typing (auto-detect numbers, booleans)
   * - Header row detection
   * - Trimming whitespace
   * - Handling encoding issues (BOM, UTF-8)
   * - Skipping empty rows
   *
   * @param content - The CSV file content as a string
   * @returns Parsed rows as an array of objects
   */
  async parseCSV(content: string): Promise<RawRow[]> {
    // TODO: Add error handling for malformed CSV
    // TODO: Add encoding detection and BOM stripping
    // TODO: Add configurable delimiter detection (comma, tab, semicolon)
    return new Promise((resolve, reject) => {
      Papa.parse<RawRow>(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          resolve(results.data);
        },
        error: (error: Error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    });
  }

  /**
   * Parse an Excel file (XLSX or XLS) from a buffer.
   * Returns all sheet names and data organized by sheet.
   *
   * TODO: Implement full Excel parsing with:
   * - Multi-sheet support
   * - Date cell formatting
   * - Merged cell handling
   * - Large file streaming for memory efficiency
   *
   * @param buffer - Raw Excel file content as a Buffer
   * @returns Object with sheet names and data per sheet
   */
  async parseExcel(
    buffer: Buffer
  ): Promise<{ sheets: string[]; data: Record<string, RawRow[]> }> {
    // TODO: Add streaming support for large files (>50MB)
    // TODO: Handle date formatting across different Excel versions
    // TODO: Handle merged cells by propagating values
    // TODO: Add configurable sheet selection (parse only specific sheets)
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets = workbook.SheetNames;
    const data: Record<string, RawRow[]> = {};

    for (const sheetName of sheets) {
      const worksheet = workbook.Sheets[sheetName];
      data[sheetName] = XLSX.utils.sheet_to_json(worksheet) as RawRow[];
    }

    return { sheets, data };
  }

  /**
   * Parse any supported file, auto-detecting the format.
   * This is the main entry point for the upload flow.
   *
   * TODO: Implement unified parse method that:
   * - Detects file type from buffer
   * - Routes to appropriate parser (CSV or Excel)
   * - For Excel files with multiple sheets, uses the first sheet by default
   *   or allows caller to specify which sheet
   * - Normalizes headers (trim, lowercase for matching)
   * - Returns a consistent ParseResult regardless of source format
   *
   * @param file - Object containing the file name and raw content buffer
   * @returns Normalized parse result with rows, headers, and metadata
   */
  async parse(file: { name: string; content: Buffer }): Promise<ParseResult> {
    // TODO: Add file size validation (reject files over configurable limit)
    // TODO: Add file name sanitization
    // TODO: Log parsing metrics (time, row count) for monitoring
    const fileType = this.detectFileType(file.content);

    if (fileType === 'csv') {
      const content = file.content.toString('utf-8');
      const rows = await this.parseCSV(content);
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      return {
        rows,
        headers,
        totalRows: rows.length,
      };
    }

    // Excel (xlsx or xls)
    const { sheets, data } = await this.parseExcel(file.content);
    const firstSheet = sheets[0];
    const rows = data[firstSheet] || [];
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      rows,
      headers,
      totalRows: rows.length,
      sheetName: firstSheet,
    };
  }
}
