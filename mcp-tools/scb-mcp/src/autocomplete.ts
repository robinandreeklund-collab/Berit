/**
 * Auto-complete selection logic
 *
 * Fills missing variables in a user-provided selection using metadata from the table:
 * 1. eliminationValueCode (if elimination=true)
 * 2. TOP(1) as last fallback
 *
 * This prevents the common "Missing mandatory variables" error from the SCB API.
 */

import { Dataset } from './types.js';

export interface AutoCompleteResult {
  selection: Record<string, string[]>;
  addedVariables: Array<{ code: string; label: string; values: string[]; reason: string }>;
  estimatedCells: number;
  warnings: string[];
}

/**
 * Auto-complete a partial selection by filling in missing variables
 * using metadata defaults.
 */
export function autoCompleteSelection(
  metadata: Dataset,
  partialSelection: Record<string, string[]> = {}
): AutoCompleteResult {
  if (!metadata.dimension) {
    return {
      selection: partialSelection,
      addedVariables: [],
      estimatedCells: 0,
      warnings: ['Ingen metadata tillgänglig för auto-complete'],
    };
  }

  const allDimensions = Object.entries(metadata.dimension);
  const completed: Record<string, string[]> = { ...partialSelection };
  const addedVariables: AutoCompleteResult['addedVariables'] = [];
  const warnings: string[] = [];

  // Normalize keys in partial selection (case-insensitive match)
  const normalizedProvided = new Map<string, string>();
  for (const key of Object.keys(partialSelection)) {
    normalizedProvided.set(key.toLowerCase(), key);
  }

  for (const [dimCode, dimDef] of allDimensions) {
    // Check if already provided (case-insensitive)
    const normalizedCode = dimCode.toLowerCase();
    if (normalizedProvided.has(normalizedCode)) {
      // Map to correct case
      const providedKey = normalizedProvided.get(normalizedCode)!;
      if (providedKey !== dimCode) {
        // Fix case mismatch
        completed[dimCode] = completed[providedKey];
        delete completed[providedKey];
      }
      continue;
    }

    const codes = Object.keys(dimDef.category.index);
    const labels = dimDef.category.label || {};
    const ext = dimDef.extension;
    const dimLower = dimCode.toLowerCase();
    const labelLower = dimDef.label.toLowerCase();

    // Strategy 0: Smart defaults for age and gender — prefer "total" aggregates
    // SCB often sets eliminationValueCode to "0" for age, which means "0 years old",
    // not "total". We must prefer "tot" or similar aggregate codes.
    const isAgeVariable = dimLower === 'alder' || dimLower === 'ålder' || dimLower === 'age'
      || labelLower.includes('ålder') || labelLower.includes('alder') || labelLower.includes('age');
    const isGenderVariable = dimLower === 'kon' || dimLower === 'kön' || dimLower === 'gender' || dimLower === 'sex'
      || labelLower.includes('kön') || labelLower.includes('kon');

    if (isAgeVariable) {
      // Prefer total/aggregate codes for age: "tot", "totalt", "total", etc.
      const totalCodes = ['tot', 'totalt', 'total', 'TOT'];
      const found = totalCodes.find(tc => codes.includes(tc));
      if (found) {
        completed[dimCode] = [found];
        addedVariables.push({
          code: dimCode,
          label: dimDef.label,
          values: [found],
          reason: `totalvärde för ålder: "${labels[found] || found}"`,
        });
        continue;
      }
      // If no "tot" exists, look for a label containing "totalt" or "samtliga"
      const totalByLabel = codes.find(c => {
        const lbl = (labels[c] || '').toLowerCase();
        return lbl.includes('totalt') || lbl.includes('samtliga') || lbl === 'total';
      });
      if (totalByLabel) {
        completed[dimCode] = [totalByLabel];
        addedVariables.push({
          code: dimCode,
          label: dimDef.label,
          values: [totalByLabel],
          reason: `totalvärde för ålder: "${labels[totalByLabel] || totalByLabel}"`,
        });
        continue;
      }
    }

    if (isGenderVariable) {
      // Prefer total/aggregate codes for gender: "1+2", "tot", "totalt"
      const totalCodes = ['1+2', 'tot', 'totalt', 'T'];
      const found = totalCodes.find(tc => codes.includes(tc));
      if (found) {
        completed[dimCode] = [found];
        addedVariables.push({
          code: dimCode,
          label: dimDef.label,
          values: [found],
          reason: `totalvärde för kön: "${labels[found] || found}"`,
        });
        continue;
      }
      // If no total code, look for a label containing "totalt" or "samtliga"
      const totalByLabel = codes.find(c => {
        const lbl = (labels[c] || '').toLowerCase();
        return lbl.includes('totalt') || lbl.includes('samtliga') || lbl === 'total';
      });
      if (totalByLabel) {
        completed[dimCode] = [totalByLabel];
        addedVariables.push({
          code: dimCode,
          label: dimDef.label,
          values: [totalByLabel],
          reason: `totalvärde för kön: "${labels[totalByLabel] || totalByLabel}"`,
        });
        continue;
      }
    }

    // Strategy 1: Use eliminationValueCode if elimination is allowed
    if (ext?.elimination && ext?.eliminationValueCode) {
      const elimCode = ext.eliminationValueCode;
      if (codes.includes(elimCode)) {
        completed[dimCode] = [elimCode];
        addedVariables.push({
          code: dimCode,
          label: dimDef.label,
          values: [elimCode],
          reason: `elimination default: "${labels[elimCode] || elimCode}"`,
        });
        continue;
      }
    }

    // Strategy 2: If only one value exists, use it
    if (codes.length === 1) {
      completed[dimCode] = [codes[0]];
      addedVariables.push({
        code: dimCode,
        label: dimDef.label,
        values: [codes[0]],
        reason: `enda tillgängliga värdet: "${labels[codes[0]] || codes[0]}"`,
      });
      continue;
    }

    // Strategy 3: For ContentsCode, select all (usually few values)
    if (dimCode === 'ContentsCode' && codes.length <= 10) {
      completed[dimCode] = codes;
      addedVariables.push({
        code: dimCode,
        label: dimDef.label,
        values: codes,
        reason: `alla innehållsvariabler (${codes.length} st)`,
      });
      continue;
    }

    // Strategy 4: For Time dimension, use TOP(1) for latest
    if (dimCode === 'Tid' || dimDef.label.toLowerCase().includes('tid') || dimDef.label.toLowerCase().includes('time')) {
      completed[dimCode] = ['TOP(1)'];
      addedVariables.push({
        code: dimCode,
        label: dimDef.label,
        values: ['TOP(1)'],
        reason: 'senaste tidsperiod',
      });
      continue;
    }

    // Strategy 5: Fallback — use TOP(1)
    completed[dimCode] = ['TOP(1)'];
    addedVariables.push({
      code: dimCode,
      label: dimDef.label,
      values: ['TOP(1)'],
      reason: 'fallback (TOP(1))',
    });
    warnings.push(`Variabel "${dimDef.label}" (${dimCode}) saknades — använde TOP(1). Ange specifika värden för bättre resultat.`);
  }

  // Estimate total cells
  const estimatedCells = estimateCellCount(metadata, completed);

  return {
    selection: completed,
    addedVariables,
    estimatedCells,
    warnings,
  };
}

/**
 * Estimate the number of data cells a selection will produce
 */
export function estimateCellCount(
  metadata: Dataset,
  selection: Record<string, string[]>
): number {
  if (!metadata.dimension) return 0;

  let totalCells = 1;

  for (const [dimCode, dimDef] of Object.entries(metadata.dimension)) {
    const selectedValues = selection[dimCode];
    if (!selectedValues) {
      // Unselected dimension — use all values
      totalCells *= Object.keys(dimDef.category.index).length;
      continue;
    }

    // Handle special expressions
    if (selectedValues.includes('*')) {
      totalCells *= Object.keys(dimDef.category.index).length;
    } else {
      let count = 0;
      for (const val of selectedValues) {
        const topMatch = val.match(/^TOP\((\d+)\)$/i);
        const bottomMatch = val.match(/^BOTTOM\((\d+)\)$/i);
        if (topMatch) {
          count += Math.min(parseInt(topMatch[1], 10), Object.keys(dimDef.category.index).length);
        } else if (bottomMatch) {
          count += Math.min(parseInt(bottomMatch[1], 10), Object.keys(dimDef.category.index).length);
        } else {
          count += 1;
        }
      }
      totalCells *= Math.max(count, 1);
    }
  }

  return totalCells;
}
