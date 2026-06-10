import * as z from 'zod';

export const formSchema = z.object({
    // This is the ID of the bridge record (PpaFundingSource)
    ppa_funding_source_id: z
        .number()
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'Funding bridge is required',
        }),
    ppmp_price_list_id: z
        .number()
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'Please select a procurement item',
        }),
    expenseAccount: z
        .number()
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'Expense account is required',
        }),
    category: z.number().nullable().optional(), // Category is often optional for some accounts
    itemNo: z.number().positive().nullable().optional(),
    description: z
        .number() // This is the ID of the price list item in your CommandSelect
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'Description is required',
        }),
    unitOfMeasurement: z.string().trim().nullable().optional(),
    price: z
        .union([z.string(), z.number()])
        .nullable()
        .refine((val) => val !== null, {
            message: 'Price is required',
        }),
    fundingSource: z
        .number()
        .nullable()
        .refine((val) => val !== null && val !== 0, {
            message: 'Funding source is required',
        }),
    // Quick-add mode fields
    month: z.string().nullable().optional(),
    quantity: z.union([z.string(), z.number()]).nullable().optional(),
});

export type FormSchemaType = z.infer<typeof formSchema>;
