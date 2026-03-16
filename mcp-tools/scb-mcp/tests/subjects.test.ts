import { describe, it, expect } from 'vitest';
import {
  SUBJECT_TREE,
  findSubjectNode,
  getSubjectChildren,
  getSearchKeywords,
  formatSubjectTree,
} from '../src/subjects.js';

describe('SUBJECT_TREE', () => {
  it('should have all major subject areas', () => {
    const codes = SUBJECT_TREE.map(s => s.id);
    expect(codes).toContain('BE');
    expect(codes).toContain('AM');
    expect(codes).toContain('NR');
    expect(codes).toContain('HE');
    expect(codes).toContain('MI');
    expect(codes).toContain('BO');
    expect(codes).toContain('UF');
    expect(codes).toContain('OE');
    expect(codes).toContain('PR');
    expect(codes).toContain('TK');
    expect(codes).toContain('ME');
  });

  it('should have level-2 children for key areas', () => {
    const be = SUBJECT_TREE.find(s => s.id === 'BE');
    expect(be?.children).toBeDefined();
    expect(be!.children!.length).toBeGreaterThanOrEqual(2);
    expect(be!.children!.some(c => c.id === 'BE0101')).toBe(true);
    expect(be!.children!.some(c => c.id === 'BE0401')).toBe(true);
  });

  it('should have level-3 children for BE0101', () => {
    const be = SUBJECT_TREE.find(s => s.id === 'BE');
    const be0101 = be?.children?.find(c => c.id === 'BE0101');
    expect(be0101?.children).toBeDefined();
    expect(be0101!.children!.some(c => c.id === 'BE0101A')).toBe(true); // Folkmängd
    expect(be0101!.children!.some(c => c.id === 'BE0101I')).toBe(true); // Döda
    expect(be0101!.children!.some(c => c.id === 'BE0101J')).toBe(true); // Flyttningar
  });
});

describe('findSubjectNode', () => {
  it('should find level-1 nodes', () => {
    const result = findSubjectNode('BE');
    expect(result).toBeDefined();
    expect(result!.depth).toBe(0);
    expect(result!.node.label).toBe('Befolkning');
    expect(result!.path).toHaveLength(1);
  });

  it('should find level-2 nodes', () => {
    const result = findSubjectNode('BE0101');
    expect(result).toBeDefined();
    expect(result!.depth).toBe(1);
    expect(result!.node.label).toBe('Befolkningsstatistik');
    expect(result!.path).toHaveLength(2);
    expect(result!.path[0].id).toBe('BE');
  });

  it('should find level-3 nodes', () => {
    const result = findSubjectNode('BE0101A');
    expect(result).toBeDefined();
    expect(result!.depth).toBe(2);
    expect(result!.node.label).toBe('Folkmängd');
    expect(result!.path).toHaveLength(3);
    expect(result!.path[0].id).toBe('BE');
    expect(result!.path[1].id).toBe('BE0101');
  });

  it('should be case-insensitive', () => {
    const result = findSubjectNode('be0101a');
    expect(result).toBeDefined();
    expect(result!.node.label).toBe('Folkmängd');
  });

  it('should return undefined for unknown codes', () => {
    expect(findSubjectNode('ZZ')).toBeUndefined();
    expect(findSubjectNode('XX9999Z')).toBeUndefined();
  });
});

describe('getSubjectChildren', () => {
  it('should return all level-1 areas when no parent specified', () => {
    const children = getSubjectChildren();
    expect(children.length).toBe(SUBJECT_TREE.length);
    expect(children[0].id).toBe(SUBJECT_TREE[0].id);
  });

  it('should return level-2 children for a level-1 code', () => {
    const children = getSubjectChildren('BE');
    expect(children.length).toBeGreaterThanOrEqual(2);
    expect(children.some(c => c.id === 'BE0101')).toBe(true);
  });

  it('should return level-3 children for a level-2 code', () => {
    const children = getSubjectChildren('BE0101');
    expect(children.some(c => c.id === 'BE0101A')).toBe(true);
  });

  it('should return empty array for leaf node', () => {
    const children = getSubjectChildren('BE0101A');
    expect(children).toHaveLength(0);
  });

  it('should return empty array for unknown code', () => {
    expect(getSubjectChildren('ZZ')).toHaveLength(0);
  });
});

describe('getSearchKeywords', () => {
  it('should collect keywords from all path levels', () => {
    const keywords = getSearchKeywords('BE0101A');
    // Should include keywords from BE, BE0101, and BE0101A
    expect(keywords).toContain('befolkning');
    expect(keywords).toContain('folkmängd');
    expect(keywords).toContain('invånare');
    expect(keywords).toContain('Folkmängd'); // the label itself
  });

  it('should return empty array for unknown code', () => {
    expect(getSearchKeywords('ZZ')).toHaveLength(0);
  });
});

describe('formatSubjectTree', () => {
  it('should return a formatted string with all level-1 areas', () => {
    const tree = formatSubjectTree();
    expect(tree).toContain('BE — Befolkning');
    expect(tree).toContain('AM — Arbetsmarknad');
    expect(tree).toContain('BE0101');
    expect(tree).toContain('BE0101A: Folkmängd');
  });
});
