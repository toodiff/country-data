// @AI_GENERATED: Kiro v1.0
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterEntries, extractCountryCode, DirEntry } from './geo';

// Feature: dir-batch-download, Property 1: Entry filtering correctness
// Validates: Requirements 2.2, 2.3
describe('Property 1: Entry filtering correctness', () => {
    const SIZE_LIMIT = 10 * 1024;

    const dirEntryArb: fc.Arbitrary<DirEntry> = fc.record({
        name: fc.string({ minLength: 1 }),
        isDirectory: fc.boolean(),
        size: fc.nat({ max: 50 * 1024 }),
    });

    it('should only return non-directory entries with size < 10KB', () => {
        fc.assert(
            fc.property(fc.array(dirEntryArb), (entries) => {
                const result = filterEntries(entries);
                for (const entry of result) {
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.size).toBeLessThan(SIZE_LIMIT);
                }
            }),
            { numRuns: 100 }
        );
    });

    it('should not drop any qualifying entry', () => {
        fc.assert(
            fc.property(fc.array(dirEntryArb), (entries) => {
                const result = filterEntries(entries);
                const expected = entries.filter(e => !e.isDirectory && e.size < SIZE_LIMIT);
                expect(result).toEqual(expected);
            }),
            { numRuns: 100 }
        );
    });
});

// Feature: dir-batch-download, Property 2: Country code extraction from filename
// Validates: Requirements 2.4
describe('Property 2: Country code extraction from filename', () => {
    it('should return the first segment before the dot', () => {
        const filenameArb = fc.tuple(
            fc.stringMatching(/^[A-Z]{2,4}$/),
            fc.array(fc.stringMatching(/^[a-z]{1,10}$/), { minLength: 1, maxLength: 3 })
        ).map(([code, rest]) => ({ filename: [code, ...rest].join('.'), expected: code }));

        fc.assert(
            fc.property(filenameArb, ({ filename, expected }) => {
                expect(extractCountryCode(filename)).toBe(expected);
            }),
            { numRuns: 100 }
        );
    });
});
// @AI_GENERATED: end
