// import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
// import DataTable from '@/pages/price-list/table/data-table';
// import { columns } from '@/pages/price-list/table/columns';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// import ExcelJS from 'exceljs';
import { PriceList, ChartOfAccount, PpmpCategory } from '@/pages/types/types';
import PriceListTablePage from '@/pages/price-list/table/page';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Price Lists', href: '#' }];

interface PriceListPageProps {
    priceList: PriceList[];
    chartOfAccounts: ChartOfAccount;
    ppmpCategory: PpmpCategory;
}

export default function PriceListPage({
    priceList,
    chartOfAccounts,
    ppmpCategory,
}: PriceListPageProps) {
    // const [file, setFile] = useState(null);

    // async function handleFileUpload() {
    //     if (!file) return;

    //     const workbook = new ExcelJS.Workbook();
    //     const reader = new FileReader();

    //     reader.readAsArrayBuffer(file);

    //     reader.onload = async () => {
    //         try {
    //             const buffer = reader.result;
    //             await workbook.xlsx.load(buffer);

    //             console.log(workbook.worksheets);

    //             // 3. Grab the first worksheet
    //             const worksheet = workbook.getWorksheet(1);
    //             const finalData = [];

    //             let currentCategory: string;

    //             // 4. Map the rows to your specific JSON structure
    //             worksheet.eachRow((row, rowNumber) => {
    //                 if (rowNumber <= 6) return; // Skip headers

    //                 const color =
    //                     row.getCell(1).style?.fill?.fgColor?.argb || 'E';

    //                 if (color === 'd0cece')
    //                     currentCategory = ppmpCategory.find(
    //                         (account) => account.name === row.getCell(3).value,
    //                     ).id;

    //                 const mappedRow = {
    //                     // id: number,
    //                     item_number: row.getCell(2).value,
    //                     description: row.getCell(3).value,
    //                     unit_of_measurement: row.getCell(4).value,
    //                     price: row.getCell(5).value,
    //                     // chart_of_account_title: row.getCell(1).value,
    //                     chart_of_account_id:
    //                         chartOfAccounts.find(
    //                             (account) =>
    //                                 account.account_title ===
    //                                 row.getCell(1).value,
    //                         )?.id || null,
    //                     ppmp_category_id: currentCategory,
    //                     // created_at: string | null,
    //                     // updated_at: string | null,
    //                 };

    //                 if (!(row.getCell(1).value === null))
    //                     finalData.push(mappedRow);
    //             });

    //             // 5. Success! Log your mapped JSON
    //             console.log('Mapped JSON Result:', finalData);
    //         } catch (error) {
    //             console.error('Error reading excel file:', error);
    //         }
    //     };
    // }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-4">
                <PriceListTablePage data={priceList}>
                    <div className="flex gap-4">
                        {/* file import */}
                        <div className="flex gap-2">
                            <Input
                                id="picture"
                                type="file"
                                // onChange={(e) => setFile(e.target.files[0])}
                            />

                            <Button
                                variant="outline"
                                // onClick={handleFileUpload}
                            >
                                Import
                            </Button>
                        </div>

                        <Button>Add Price List</Button>
                    </div>
                </PriceListTablePage>
            </div>
        </AppLayout>
    );
}
