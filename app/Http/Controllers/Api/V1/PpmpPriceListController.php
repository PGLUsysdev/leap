<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PpmpPriceListResource;
use App\Models\PpmpPriceList;
use Illuminate\Http\Request;

class PpmpPriceListController extends Controller
{
    private const SORTABLE = [
        'id', 'item_number', 'sort_order', 'description',
        'price', 'unit_of_measurement', 'updated_at',
    ];

    public function index(Request $request)
    {
        $data = $request->validate([
            'ppmp_category_id' => ['nullable', 'integer', 'exists:ppmp_categories,id'],
            'chart_of_account_id' => ['nullable', 'integer', 'exists:chart_of_accounts,id'],
            'chart_of_account_ppmp_category_id' => ['nullable', 'integer'],
            'search' => ['nullable', 'string', 'max:100'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'updated_since' => ['nullable', 'date'],
            'sort' => ['nullable', 'string', 'regex:/^-?[a-z_]+$/'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = PpmpPriceList::query()->with([
            'chartOfAccountPpmpCategory.chartOfAccount',
            'chartOfAccountPpmpCategory.ppmpCategory',
        ]);

        if (! empty($data['ppmp_category_id'])) {
            $query->whereHas('chartOfAccountPpmpCategory',
                fn ($q) => $q->where('ppmp_category_id', $data['ppmp_category_id']));
        }

        if (! empty($data['chart_of_account_id'])) {
            $query->whereHas('chartOfAccountPpmpCategory',
                fn ($q) => $q->where('chart_of_account_id', $data['chart_of_account_id']));
        }

        if (! empty($data['chart_of_account_ppmp_category_id'])) {
            $query->where('chart_of_account_ppmp_category_id', $data['chart_of_account_ppmp_category_id']);
        }

        if (! empty($data['search'])) {
            $query->where('description', 'like', '%'.$data['search'].'%');
        }

        if (isset($data['min_price'])) {
            $query->where('price', '>=', $data['min_price']);
        }

        if (isset($data['max_price'])) {
            $query->where('price', '<=', $data['max_price']);
        }

        if (! empty($data['updated_since'])) {
            $query->where('updated_at', '>=', $data['updated_since']);
        }

        $sort = $data['sort'] ?? 'sort_order';
        $desc = str_starts_with($sort, '-');
        $column = ltrim($sort, '-');

        if (! in_array($column, self::SORTABLE, true)) {
            $column = 'sort_order';
            $desc = false;
        }

        $query->orderBy($column, $desc ? 'desc' : 'asc');
        $query->orderBy('id');

        $paginator = $query->paginate($data['per_page'] ?? 50)->withQueryString();

        return PpmpPriceListResource::collection($paginator);
    }

    public function show(PpmpPriceList $ppmpPriceList)
    {
        $ppmpPriceList->load([
            'chartOfAccountPpmpCategory.chartOfAccount',
            'chartOfAccountPpmpCategory.ppmpCategory',
        ]);

        return new PpmpPriceListResource($ppmpPriceList);
    }
}
