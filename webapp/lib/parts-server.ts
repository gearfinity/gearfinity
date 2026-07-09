// Build-time access to the parts catalog (parts.csv, synced from the repo
// root). Server-only: uses fs, so import it from server components and pass
// the result into client components as props.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface PartInfo {
  name: string;
  notes: string;
}

/** Minimal CSV parser that handles quoted fields with embedded newlines
 *  (the Printing Notes column is multi-line). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

let cache: Record<string, PartInfo> | null = null;

export function partsCatalog(): Record<string, PartInfo> {
  if (cache) return cache;
  const raw = readFileSync(join(process.cwd(), "data", "parts.csv"), "utf-8");
  const rows = parseCsv(raw);
  const header = rows[0];
  const iId = header.indexOf("ID");
  const iName = header.indexOf("Name");
  const iNotes = header.indexOf("Printing Notes");
  const out: Record<string, PartInfo> = {};
  for (const r of rows.slice(1)) {
    const id = (r[iId] ?? "").trim();
    if (!id) continue;
    out[id] = {
      name: (r[iName] ?? "").trim(),
      notes: (r[iNotes] ?? "").trim(),
    };
  }
  cache = out;
  return out;
}
