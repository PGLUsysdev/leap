import * as z from 'zod';

export const formSchema = z.object({
    aip_entry_id: z
        .number()
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'AIP entry ID is required',
        }),
    ppmp_price_list_id: z
        .number()
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'PPMP price list ID is required',
        }),
    expenseAccount: z
        .number()
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'Expense account is required',
        }),
    category: z
        .number()
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'Category is required',
        }),
    itemNo: z
        .number()
        .positive()
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'Item number is required',
        }),
    description: z
        .number()
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'Description is required and is greater than 0',
        }),
    unitOfMeasurement: z
        .string()
        .trim()
        .nullable()
        .refine((val) => val !== null && val !== '', {
            message: 'Unit of measurement is required',
        }),
    price: z
        .string()
        .nullable()
        .refine((val) => val !== null && /^\d*\.?\d+$/.test(val), {
            message: 'Price must contain only numeric characters',
        }),
    fundingSource: z
        .number()
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'Funding source is required',
        }),
});

export type FormSchemaType = z.infer<typeof formSchema>;
