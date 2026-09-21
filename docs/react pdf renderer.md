# PPMP PDF Renderer Architecture Documentation

## Overview

This architecture implements a **TanStack Table-inspired pattern** for generating complex PDF tables with `@react-pdf/renderer`. It separates data preparation, column definitions, and rendering into distinct layers, making the system **reusable**, **testable**, and **maintainable**.

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Architecture Layers](#architecture-layers)
3. [Data Flow](#data-flow)
4. [Core Components](#core-components)
5. [Implementing a New Report](#implementing-a-new-report)
6. [Styling Guide](#styling-guide)
7. [Best Practices](#best-practices)
8. [API Reference](#api-reference)

---

## Core Philosophy

The architecture is built on three key principles:

### 1. Separation of Concerns

- **Data preparation** (grouping, aggregation, flattening) is independent of rendering.
- **Column definitions** control what and how data is displayed.
- **Table rendering** is a pure layout engine that doesn't know about business logic.

### 2. TanStack Table Pattern

- Columns define **headers** and **cell renderers** as `React.ReactNode`.
- Data is transformed into a **flat row model** (banners, items, totals) before rendering.
- The table component loops over this flat model, applying the appropriate renderer for each row type.

### 3. Reusability

- The same table component can render any report by swapping:
    - Column definitions (`getXxxColumnDefs`)
    - Row preprocessors (`prepareXxxRows`)
    - Document wrappers (`XxxDocument`)

---

## Architecture Layers

```
┌────────────────────────────────────────────────────────────────┐
│                        DOCUMENT LAYER                          │
│  (Page layout, header, signatures, footer, page settings)      │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   TABLE LAYER                           │   │
│  │  (Pure renderer – no business logic)                    │   │
│  │                                                         │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │   │
│  │  │   Banner Row  │  │   Item Row    │  │  Total Row  │  │   │
│  │  └───────────────┘  └───────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ▲                                 │
│                              │                                 │
│  ┌───────────────────────────┼──────────────────────────────┐  │
│  │                    PREPROCESSOR LAYER                    │  │
│  │  (Raw data → Flat row model with banners, items, totals) │  │
│  │                                                          │  │
│  │  ┌──────────────────┐        ┌─────────────────────────┐ │  │
│  │  │ preparePpmpRows  │        │ prepareSummaryRows      │ │  │
│  │  └──────────────────┘        └─────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ▲                                 │
│                              │                                 │
│  ┌───────────────────────────┼──────────────────────────────┐  │
│  │                     DATA SOURCE LAYER                    │  │
│  │  (API response, database query, raw groupedData)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
Raw Data (array of items)
    │
    ▼
┌─────────────────────────────────────────┐
│           Preprocessor                  │
│  (preparePpmpRows / prepareSummaryRows) │
│                                         │
│  1. Group data (by program, category,   │
│     COA, expense class, etc.)           │
│  2. Calculate aggregates (totals,       │
│     subtotals)                          │
│  3. Flatten into TableRow[]             │
│     - Banners (prog-, cat-, coa-)       │
│     - Items (item-)                     │
│     - Subtotals (subtotal-)             │
│     - Grand totals (grand-total-)       │
│     - Spacers (spacer-)                 │
└─────────────────────────────────────────┘
    │
    ▼
TableRow[] (flat array of row definitions)
    │
    ▼
┌──────────────────────────────────────┐
│        Table Renderer                │
│        (PpmpPdfTable)                │
│                                      │
│  rows.map((row) => {                 │
│    switch(row.type) {                │
│      case 'banner': renderBanner     │
│      case 'item':   renderItem       │
│      case 'subtotal': renderTotal    │
│      case 'grand-total': renderTotal │
│      case 'spacer':  renderSpacer    │
│    }                                 │
│  })                                  │
└──────────────────────────────────────┘
    │
    ▼
PDF Output
```

---

## Core Components

### 1. Types (`types.ts`)

```typescript
// Column definition – controls what and how to render
export interface ColumnDef<T> {
    id: string; // Unique identifier, used for alignment logic
    header: React.ReactNode; // React element, fully stylable
    width: string; // Percentage width (e.g., '15%')
    cell: (item: T) => React.ReactNode; // Cell renderer
}

// Row definition – the flat row model
export type TableRowType =
    'banner' | 'item' | 'subtotal' | 'grand-total' | 'spacer';

export interface TableRow {
    id: string; // Unique key for React
    type: TableRowType; // Determines how to render
    label?: string; // For banners and total rows
    item?: any; // For item rows
    totals?: Record<string, number>; // For total rows
}
```

### 2. Column Definitions (`ppmp/cols.tsx`)

**Purpose:** Defines columns (headers, widths, cell renderers) for a specific report.

**Key Features:**

- All cells return `<Text>` elements with explicit styling (fontSize, color, textAlign).
- Headers also return `<Text>` elements.
- Alignment is controlled via `textAlign` in the styles, not an `align` property.

```typescript
export const getPpmpColumnDefs = <T>(): ColumnDef<T>[] => [
    {
        id: 'description',
        header: <Text style={headerStyle('left')}>Description</Text>,
        width: '15.4%',
        cell: (item) => (
            <Text style={cellStyle('left')}>
                {item.ppmp_price_list?.description ?? '-'}
            </Text>
        ),
    },
    // ...
];
```

**Helper Functions:**

```typescript
const cellStyle = (align: 'left' | 'center' | 'right') => ({
    textAlign: align,
    fontSize: 5,
    color: '#000000',
});

const headerStyle = (align: 'left' | 'center' | 'right') => ({
    textAlign: align,
    fontSize: 5,
    fontWeight: 'bold' as const,
});
```

### 3. Preprocessor (`ppmp/prepare-ppmp-rows.ts`)

**Purpose:** Transforms raw data into a flat array of `TableRow` definitions.

**Key Responsibilities:**

- Group data using nested Maps.
- Calculate aggregates (totals, subtotals).
- Assign unique IDs using a counter.
- Flatten the hierarchy into a single array.

```typescript
export function preparePpmpRows(rawItems: any[]): TableRow[] {
    const rows: TableRow[] = [];
    let rowIdCounter = 0;

    // 1. Bucket raw items
    const programMap = new Map<...>();
    rawItems.forEach((item) => { /* ... */ });

    // 2. Flatten
    for (const [programTitle, categoryMap] of programMap) {
        // Banner
        rows.push({ id: `row-${rowIdCounter++}`, type: 'banner', label: programTitle });

        for (const [categoryName, coaMap] of categoryMap) {
            // Category banner
            rows.push({ id: `row-${rowIdCounter++}`, type: 'banner', label: categoryName });

            for (const [coaKey, coaData] of coaMap) {
                // COA banner
                rows.push({ id: `row-${rowIdCounter++}`, type: 'banner', label: coaData.title });

                // Item rows
                coaData.items.forEach((item) => {
                    rows.push({ id: `row-${rowIdCounter++}`, type: 'item', item });
                });
            }

            // Category subtotal
            const categoryItems = /* ... */;
            rows.push({
                id: `row-${rowIdCounter++}`,
                type: 'subtotal',
                label: `${categoryName} - TOTAL`,
                totals: calculateTotals(categoryItems),
            });
        }

        // Program subtotal
        // ...
    }

    // Grand total
    rows.push({ id: `row-${rowIdCounter++}`, type: 'grand-total', label: 'GRAND TOTAL', totals: calculateTotals(rawItems) });

    return rows;
}
```

**ID Generation Strategy:**

- Use a simple counter (`rowIdCounter`) to assign unique IDs.
- IDs follow the format `row-0`, `row-1`, `row-2`, etc.
- This guarantees uniqueness across all rows, regardless of data content.

### 4. Generic Table (`table.tsx`)

**Purpose:** A pure, reusable layout engine.

**Key Features:**

- **Header row** – Renders `col.header` as-is; if it's a string, wraps it in `<Text>`.
- **Item rows** – Renders `col.cell(row.item)`, wrapping in `<Text>` if needed.
- **Banner rows** – Renders the label in the `description` column only.
- **Total rows** – Formats totals based on column ID heuristics.
- **Spacer rows** – Renders empty cells with borders.

**Smart Rendering (`renderContent`):**

```typescript
const renderContent = (content: React.ReactNode, defaultStyle: any) => {
    if (React.isValidElement(content) && content.type === Text) {
        return content;
    }
    return <Text style={defaultStyle}>{content}</Text>;
};
```

**Style Selection by ID Prefix:**

```typescript
switch (row.type) {
    case 'banner':
        if (row.id.startsWith('prog-'))
            return renderBannerRow(
                row,
                styles.programBannerRow,
                styles.programBannerText,
            );
        if (row.id.startsWith('cat-'))
            return renderBannerRow(
                row,
                styles.categoryRow,
                styles.categoryText,
            );
        if (row.id.startsWith('coa-'))
            return renderBannerRow(row, styles.coaRow, styles.coaText);
        break;
    case 'subtotal':
        if (row.id.startsWith('summary-'))
            return renderTotalRow(row, styles.summarySubtotalRow);
        if (row.id.startsWith('prog-total-'))
            return renderTotalRow(row, styles.programTotalRow);
        return renderTotalRow(row, styles.categoryTotalRow);
    // ...
}
```

**Total Alignment Heuristics:**

```typescript
function getTotalTextAlign(columnId: string): 'left' | 'center' | 'right' {
    if (columnId === 'description') return 'left';
    if (columnId === 'total_qty' || columnId.endsWith('_qty')) return 'center';
    if (columnId === 'total_amount' || columnId.endsWith('_amount'))
        return 'right';
    if (columnId === 'total' || /^q[1-4]$/.test(columnId)) return 'right';
    return 'left';
}
```

### 5. Document Wrapper (`ppmp/document.tsx`)

**Purpose:** Defines page layout, header, signatures, and footer.

**Key Features:**

- Specific to each report type.
- Composes the generic table with report-specific columns and preprocessed rows.
- Renders static content (logos, titles, signatures).
- Handles page settings (size, orientation, margins).

```typescript
export const PpmpDocument: React.FC<PpmpDocumentProps> = ({ aipEntry, fiscalYear, groupedData, ppaFundingSource }) => {
    const columns = getPpmpColumnDefs();
    const rows = preparePpmpRows(groupedData);

    return (
        <Document>
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                {/* Custom header */}
                <View fixed style={styles.header}>...</View>

                {/* Generic table */}
                <PpmpPdfTable columns={columns} rows={rows} />

                {/* Custom signatures */}
                <View style={styles.signatureSection}>...</View>

                {/* Custom footer */}
                <View style={styles.footer} fixed>...</View>
            </Page>
        </Document>
    );
};
```

---

## Implementing a New Report

### Step 1: Define Column Definitions

```typescript
// reports/new-report/cols.tsx
import { Text } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/utils';
import type { ColumnDef } from '../types';

const cellStyle = (align: 'left' | 'center' | 'right') => ({
    textAlign: align,
    fontSize: 5,
    color: '#000000',
});

const headerStyle = (align: 'left' | 'center' | 'right') => ({
    textAlign: align,
    fontSize: 5,
    fontWeight: 'bold' as const,
});

export const getNewReportColumnDefs = <T>(): ColumnDef<T>[] => [
    {
        id: 'description',
        header: <Text style={headerStyle('left')}>Description</Text>,
        width: '30%',
        cell: (item) => <Text style={cellStyle('left')}>{item.name || '-'}</Text>,
    },
    {
        id: 'amount',
        header: <Text style={headerStyle('right')}>Amount</Text>,
        width: '15%',
        cell: (item) => <Text style={cellStyle('right')}>{formatCurrency(item.amount)}</Text>,
    },
    // ...
];
```

### Step 2: Create Preprocessor

```typescript
// reports/new-report/prepare-new-report-rows.ts
import type { TableRow } from '../types';

export function prepareNewReportRows(rawItems: any[]): TableRow[] {
    const rows: TableRow[] = [];
    let rowIdCounter = 0;

    // Group, aggregate, flatten
    // ... logic ...

    return rows;
}
```

### Step 3: Build Document Wrapper

```typescript
// reports/new-report/document.tsx
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PpmpPdfTable } from '../table';
import { getNewReportColumnDefs } from './cols';
import { prepareNewReportRows } from './prepare-new-report-rows';

export const NewReportDocument = ({ data }) => {
    const columns = getNewReportColumnDefs();
    const rows = prepareNewReportRows(data);

    return (
        <Document>
            <Page size={[612, 936]} orientation="landscape">
                {/* Header */}
                <View><Text>My Custom Report</Text></View>

                {/* Table */}
                <PpmpPdfTable columns={columns} rows={rows} />

                {/* Footer */}
                <View fixed><Text>Page 1 of 1</Text></View>
            </Page>
        </Document>
    );
};
```

---

## Styling Guide

### Banner Rows

| Type     | ID Prefix | Style Name         | Description                    |
| :------- | :-------- | :----------------- | :----------------------------- |
| Program  | `prog-`   | `programBannerRow` | No background, bold, uppercase |
| Category | `cat-`    | `categoryRow`      | Gray background (`#D0CECE`)    |
| COA      | `coa-`    | `coaRow`           | Peach background (`#FBE4D5`)   |

### Total Rows

| Type           | ID Prefix     | Style Name         | Description              |
| :------------- | :------------ | :----------------- | :----------------------- |
| Category Total | `cat-total-`  | `categoryTotalRow` | Light yellow (`#FEF2CB`) |
| Program Total  | `prog-total-` | `programTotalRow`  | Yellow (`#FFFF00`)       |
| Grand Total    | `grand-total` | `grandTotalRow`    | Green (`#00B050`)        |

### Summary Report Totals

| Type                | ID Prefix  | Style Name             | Description   |
| :------------------ | :--------- | :--------------------- | :------------ |
| Summary Subtotal    | `summary-` | `summarySubtotalRow`   | No background |
| Summary Grand Total | `summary-` | `summaryGrandTotalRow` | No background |

### Adding a New Style

```typescript
// In table.tsx
const styles = StyleSheet.create({
    // ...
    myCustomRow: {
        flexDirection: 'row',
        backgroundColor: '#FF6600',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },
});

// In the switch:
case 'banner':
    if (row.id.startsWith('my-')) {
        return renderBannerRow(row, styles.myCustomRow, styles.myCustomText);
    }
```

---

## Best Practices

### 1. Use Counter for IDs

```typescript
let rowIdCounter = 0;
rows.push({ id: `row-${rowIdCounter++}`, type: 'banner', label: 'My Banner' });
```

### 2. Explicit Cell Styling

**Don't rely on table component for styling:**

```typescript
// ❌ Bad – styling depends on table component
cell: (item) => formatCurrency(item.amount)

// ✅ Good – cell controls its own style
cell: (item) => (
    <Text style={{ textAlign: 'right', fontSize: 5, color: '#000000' }}>
        {formatCurrency(item.amount)}
    </Text>
)
```

### 3. Use Helpers for Consistency

```typescript
const cellStyle = (align: 'left' | 'center' | 'right') => ({
    textAlign: align,
    fontSize: 5,
    color: '#000000',
});

const headerStyle = (align: 'left' | 'center' | 'right') => ({
    textAlign: align,
    fontSize: 5,
    fontWeight: 'bold' as const,
});
```

### 4. Keep Table Component Pure

The table component should **not** know about:

- Business logic (what is a PPMP? what is a COA?)
- Data shape (what fields exist on `item`?)
- Data transformation (grouping, sorting, filtering)

### 5. Keep Preprocessor Pure

The preprocessor should **not** know about:

- PDF rendering
- Column definitions
- Styling

### 6. Document Wrapper for Layout Only

The document wrapper should only:

- Define page layout (header, footer, signatures)
- Compose the table with columns and preprocessed data
- **Not** contain business logic

---

## API Reference

### `ColumnDef<T>`

| Property | Type                           | Description                                                      |
| :------- | :----------------------------- | :--------------------------------------------------------------- |
| `id`     | `string`                       | Unique identifier for the column. Used for alignment heuristics. |
| `header` | `React.ReactNode`              | Header content. Should be `<Text>` with explicit styling.        |
| `width`  | `string`                       | Column width as percentage (e.g., `'15%'`).                      |
| `cell`   | `(item: T) => React.ReactNode` | Cell renderer. Should return `<Text>` with explicit styling.     |

### `TableRow`

| Property | Type                                | Description                                                                |
| :------- | :---------------------------------- | :------------------------------------------------------------------------- |
| `id`     | `string`                            | Unique key for React. Use `row-{counter}`.                                 |
| `type`   | `TableRowType`                      | Row type: `'banner'`, `'item'`, `'subtotal'`, `'grand-total'`, `'spacer'`. |
| `label`  | `string` (optional)                 | Label text for banners and total rows.                                     |
| `item`   | `any` (optional)                    | Raw data for item rows.                                                    |
| `totals` | `Record<string, number>` (optional) | Totals object for total rows.                                              |

### `PpmpPdfTable`

| Prop          | Type                              | Description                       |
| :------------ | :-------------------------------- | :-------------------------------- |
| `columns`     | `ColumnDef<T>[]`                  | Column definitions for the table. |
| `rows`        | `TableRow[]`                      | Flat array of row definitions.    |
| `headerStyle` | `StyleProp<ViewStyle>` (optional) | Override header row styles.       |

---

## Troubleshooting Guide

### Duplicate Key Warnings

**Problem:** React complains about duplicate keys.

**Solution:** Use a counter for IDs:

```typescript
let rowIdCounter = 0;
rows.push({ id: `row-${rowIdCounter++}`, type: 'banner', label: ... });
```

### Missing Borders

**Problem:** Some rows don't have left border.

**Solution:** Ensure `leftBorderStyle` is applied to the first column:

```typescript
cIdx === 0 ? leftBorderStyle : {};
```

### Incorrect Alignment

**Problem:** Numbers not aligned right.

**Solution:** Check `getTotalTextAlign` and ensure column IDs match:

```typescript
if (columnId === 'total_amount' || columnId.endsWith('_amount')) return 'right';
```

### Header Background Not Removing

**Problem:** `headerStyle` prop not working.

**Solution:** Apply styles as an array:

```typescript
<View fixed style={[styles.headerRow, headerStyle]}>
```

---

## Examples

### Adding a New Row Type

**1. Add to `TableRowType`:**

```typescript
export type TableRowType =
    'banner' | 'item' | 'subtotal' | 'grand-total' | 'spacer' | 'empty';
```

**2. Add style:**

```typescript
emptyRow: {
    flexDirection: 'row',
    minHeight: 5,
},
```

**3. Add renderer and switch case:**

```typescript
const renderEmptyRow = () => (
    <View key={row.id} style={styles.emptyRow}>
        {columns.map((col, idx) => (
            <View key={col.id} style={{ width: col.width }} />
        ))}
    </View>
);

// In switch:
case 'empty':
    return renderEmptyRow();
```

**4. Use in preprocessor:**

```typescript
rows.push({ id: `row-${rowIdCounter++}`, type: 'empty' });
```

---

## Summary

This architecture provides:

- **Separation of Concerns** – Each layer has a single responsibility.
- **Reusability** – The same table component powers multiple reports.
- **Extensibility** – Adding a new report requires only column definitions and a preprocessor.
- **Maintainability** – Business logic is isolated from rendering.
- **Testability** – Preprocessors can be unit-tested without PDF rendering.

The pattern is inspired by TanStack Table but adapted for the static, layout-first world of PDF generation with `@react-pdf/renderer`.
