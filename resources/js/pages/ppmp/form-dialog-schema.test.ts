import { expect, test, describe } from 'bun:test';
import { formSchema } from './form-dialog-schema';

describe('formSchema Validation Suite', () => {
    const validMock = {
        aip_entry_id: 101,
        ppmp_price_list_id: 202,
        expenseAccount: 303,
        category: 1,
        itemNo: 5,
        description: 99,
        unitOfMeasurement: 'Piece',
        price: '1500.50',
        fundingSource: 1,
        isCustomItem: false,
    };

    test('should pass with 100% valid data', () => {
        const result = formSchema.safeParse(validMock);
        expect(result.success).toBe(true);
    });

    describe('Initial State and Nullability', () => {
        test('should fail if all fields are null (initial state)', () => {
            const initialState = {
                aip_entry_id: null,
                ppmp_price_list_id: null,
                expenseAccount: null,
                category: null,
                itemNo: null,
                description: null,
                unitOfMeasurement: null,
                price: null,
                fundingSource: null,
                isCustomItem: false,
            };
            const result = formSchema.safeParse(initialState);
            expect(result.success).toBe(false);

            if (!result.success) {
                // Confirming that multiple fields are caught by refinements
                expect(result.error.issues.length).toBeGreaterThan(5);
            }
        });
    });

    describe('Numeric ID Refinements (Non-zero check)', () => {
        const numericFields = [
            'aip_entry_id',
            'ppmp_price_list_id',
            'expenseAccount',
            'category',
            'fundingSource',
            'description',
        ];

        numericFields.forEach((field) => {
            test(`should fail if ${field} is 0`, () => {
                const invalidData = { ...validMock, [field]: 0 };
                const result = formSchema.safeParse(invalidData);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) =>
                        i.path.includes(field),
                    );
                    expect(issue?.message).toBeDefined();
                }
            });
        });
    });

    describe('Field Specific Validations', () => {
        test('should fail if unitOfMeasurement is an empty string after trim', () => {
            const result = formSchema.safeParse({
                ...validMock,
                unitOfMeasurement: '   ',
            });
            expect(result.success).toBe(false);
        });

        test('should fail if price contains non-numeric characters', () => {
            // Testing with a comma which is not allowed by your regex
            const result = formSchema.safeParse({
                ...validMock,
                price: '1,200.00',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'Price must contain only numeric characters',
                );
            }
        });

        test('should pass if price is a clean decimal string', () => {
            const result = formSchema.safeParse({
                ...validMock,
                price: '1200.00',
            });
            expect(result.success).toBe(true);
        });

        test('should fail if itemNo is a negative number', () => {
            const result = formSchema.safeParse({ ...validMock, itemNo: -1 });
            expect(result.success).toBe(false);
        });

        test('should validate that isCustomItem is a boolean', () => {
            // @ts-ignore
            const result = formSchema.safeParse({
                ...validMock,
                isCustomItem: 'true',
            });
            expect(result.success).toBe(false);
        });
    });
});
