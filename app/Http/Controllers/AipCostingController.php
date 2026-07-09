<?php

namespace App\Http\Controllers;

use App\Models\AipEntry;
use App\Models\PpaItemizedCost;
use Illuminate\Http\Request;

class AipCostingController extends Controller
{
    public function store(Request $request, AipEntry $aipEntry)
    {
        $validated = $request->validate([
            // Must be a valid code from your seeded chart_of_accounts table
            'account_code' => 'required|exists:chart_of_accounts,account_code',

            // The "Basis of Costing" description
            'item_description' => 'required|string|max:255',

            // Numeric values for the math
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'required|numeric|min:0',

            // PPMP Integration fields
            'ppmp_price_list_id' => 'nullable|exists:ppmp_price_lists,id',
            'requires_procurement' => 'boolean',
        ]);

        // Create the line item.
        // NOTE: Your Model's "booted" method will automatically calculate
        // the 'amount' and update the Parent 'aip_entry' totals.
        $aipEntry->itemizedCosts()->create($validated);

        // This triggers Inertia to refresh the page props (updating your AIP Tree)
        return redirect()->back();
    }

    public function destroy($id)
    {
        // Find the item (Assuming the model name is PpaItemizedCost)
        // We use the ID passed from your React handleDelete(item.id)
        $item = PpaItemizedCost::findOrFail($id);

        // Delete it.
        // This triggers the 'static::deleted' hook in your booted method!
        $item->delete();

        // Redirect back to refresh the Inertia props
        return redirect()->back();
    }
}
