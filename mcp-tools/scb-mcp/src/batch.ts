/**
 * Batching logic for large SCB queries
 *
 * When a query exceeds the maxDataCells limit, split it into
 * multiple sequential requests along the time dimension and
 * merge the results.
 */

import { Dataset } from './types.js';

export interface BatchPlan {
  batches: Array<{
    selection: Record<string, string[]>;
    estimatedCells: number;
  }>;
  totalBatches: number;
  splitDimension: string;
  reason: string;
}

/**
 * Create a batch plan if the estimated cell count exceeds the limit.
 * Splits along the dimension with the most values (typically Tid or Region).
 */
export function createBatchPlan(
  metadata: Dataset,
  selection: Record<string, string[]>,
  maxDataCells: number,
  estimatedCells: number
): BatchPlan | null {
  if (estimatedCells <= maxDataCells) {
    return null; // No batching needed
  }

  if (!metadata.dimension) {
    return null;
  }

  // Find the best dimension to split on (prefer Tid, then Region, then largest)
  const dimensions = Object.entries(metadata.dimension);
  let splitDim: { code: string; values: string[] } | null = null;

  // Check if Tid is in the selection with many values
  for (const preferredDim of ['Tid', 'Region']) {
    const dimDef = metadata.dimension[preferredDim];
    const selectedValues = selection[preferredDim];
    if (dimDef && selectedValues) {
      const resolvedValues = resolveValues(selectedValues, Object.keys(dimDef.category.index));
      if (resolvedValues.length > 1) {
        splitDim = { code: preferredDim, values: resolvedValues };
        break;
      }
    }
  }

  // Fallback: find the dimension with the most selected values
  if (!splitDim) {
    let maxCount = 0;
    for (const [code, def] of dimensions) {
      const selectedValues = selection[code];
      if (selectedValues) {
        const resolvedValues = resolveValues(selectedValues, Object.keys(def.category.index));
        if (resolvedValues.length > maxCount) {
          maxCount = resolvedValues.length;
          splitDim = { code, values: resolvedValues };
        }
      }
    }
  }

  if (!splitDim || splitDim.values.length <= 1) {
    return null; // Can't split further
  }

  // Calculate how many values we can include per batch
  const cellsPerValue = estimatedCells / splitDim.values.length;
  const valuesPerBatch = Math.max(1, Math.floor(maxDataCells / cellsPerValue));

  // Create batches
  const batches: BatchPlan['batches'] = [];
  for (let i = 0; i < splitDim.values.length; i += valuesPerBatch) {
    const batchValues = splitDim.values.slice(i, i + valuesPerBatch);
    const batchSelection = { ...selection, [splitDim.code]: batchValues };
    batches.push({
      selection: batchSelection,
      estimatedCells: Math.ceil(cellsPerValue * batchValues.length),
    });
  }

  return {
    batches,
    totalBatches: batches.length,
    splitDimension: splitDim.code,
    reason: `Query överskrider gränsen på ${maxDataCells.toLocaleString('sv-SE')} celler (estimerat: ${estimatedCells.toLocaleString('sv-SE')}). Delar upp i ${batches.length} batchar på dimensionen "${splitDim.code}".`,
  };
}

/**
 * Merge multiple JSON-stat2 datasets into one
 * Assumes they share the same dimensions (just different values on the split dimension)
 */
export function mergeDatasets(datasets: Dataset[], splitDimension: string): Dataset {
  if (datasets.length === 0) {
    throw new Error('No datasets to merge');
  }
  if (datasets.length === 1) {
    return datasets[0];
  }

  const base = datasets[0];
  const merged: Dataset = {
    ...base,
    value: [],
    dimension: { ...base.dimension },
  };

  // Merge the split dimension's categories
  const mergedCategories: Record<string, number> = {};
  const mergedLabels: Record<string, string> = {};
  let indexCounter = 0;

  for (const ds of datasets) {
    const dim = ds.dimension?.[splitDimension];
    if (!dim) continue;

    for (const [code, _idx] of Object.entries(dim.category.index)) {
      if (!(code in mergedCategories)) {
        mergedCategories[code] = indexCounter++;
        if (dim.category.label?.[code]) {
          mergedLabels[code] = dim.category.label[code];
        }
      }
    }
  }

  if (merged.dimension && merged.dimension[splitDimension]) {
    merged.dimension[splitDimension] = {
      ...merged.dimension[splitDimension],
      category: {
        index: mergedCategories,
        label: mergedLabels,
      },
    };
  }

  // Merge values (simple concatenation since batches are sequential)
  const allValues: (number | null)[] = [];
  for (const ds of datasets) {
    if (ds.value) {
      allValues.push(...ds.value);
    }
  }
  merged.value = allValues;

  // Update size array
  if (merged.size && merged.dimension) {
    const dimOrder = Object.keys(merged.dimension);
    merged.size = dimOrder.map(dimCode => {
      return Object.keys(merged.dimension![dimCode].category.index).length;
    });
  }

  return merged;
}

/**
 * Resolve special expressions like * and TOP(N) into concrete value lists
 */
function resolveValues(selectedValues: string[], allValues: string[]): string[] {
  const result: string[] = [];

  for (const val of selectedValues) {
    if (val === '*') {
      return [...allValues]; // All values
    }

    const topMatch = val.match(/^TOP\((\d+)\)$/i);
    if (topMatch) {
      const n = parseInt(topMatch[1], 10);
      return allValues.slice(-n);
    }

    const bottomMatch = val.match(/^BOTTOM\((\d+)\)$/i);
    if (bottomMatch) {
      const n = parseInt(bottomMatch[1], 10);
      return allValues.slice(0, n);
    }

    result.push(val);
  }

  return result;
}
