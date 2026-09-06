import type ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { cellText } from '@/lib/excel/cell-helpers';

function fakeCell(value: unknown): ExcelJS.Cell {
    return { value } as unknown as ExcelJS.Cell;
}

describe('cellText', () => {
    it('should_ReturnNull_When_ValueIsNullOrEmpty', () => {
        expect(cellText(fakeCell(null))).toBeNull();
        expect(cellText(fakeCell(undefined))).toBeNull();
        expect(cellText(fakeCell(''))).toBeNull();
        expect(cellText(fakeCell('   '))).toBeNull();
    });

    it('should_ReturnTrimmedString_When_ValueIsPlain', () => {
        // Arrange
        const cell = fakeCell('  hello  ');
        // Act
        const result = cellText(cell);
        // Assert
        expect(result).toBe('hello');
    });

    it('should_ReturnStringifiedNumber_When_ValueIsNumeric', () => {
        expect(cellText(fakeCell(42))).toBe('42');
    });

    it('should_UnwrapResult_When_ValueIsFormulaResult', () => {
        expect(cellText(fakeCell({ result: '  hi ' }))).toBe('hi');
        expect(cellText(fakeCell({ result: 123 }))).toBe('123');
        expect(cellText(fakeCell({ result: null }))).toBeNull();
    });

    it('should_JoinRichText_When_ValueHasRichText', () => {
        const cell = fakeCell({
            richText: [{ text: 'Hello ' }, { text: 'World' }],
        });
        expect(cellText(cell)).toBe('Hello World');
    });

    it('should_ReturnNull_When_RichTextIsEmpty', () => {
        expect(cellText(fakeCell({ richText: [] }))).toBeNull();
        expect(cellText(fakeCell({ richText: [{ text: '   ' }] }))).toBeNull();
    });

    it('should_ReturnText_When_ValueHasTextField', () => {
        expect(cellText(fakeCell({ text: '  link ' }))).toBe('link');
        expect(
            cellText(fakeCell({ text: '  link ', hyperlink: 'http://x' })),
        ).toBe('link');
    });

    it('should_ReturnNull_When_OnlyHyperlinkPresentWithoutText', () => {
        // Documents current behavior: bare { hyperlink } has no "text" key -> null.
        expect(cellText(fakeCell({ hyperlink: 'http://x' }))).toBeNull();
    });

    it('should_ReturnNull_When_ValueIsUnknownObject', () => {
        expect(cellText(fakeCell({ foo: 1 }))).toBeNull();
    });
});
