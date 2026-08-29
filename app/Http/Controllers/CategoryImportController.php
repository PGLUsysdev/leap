<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class CategoryImportController extends Controller
{
    public function index()
    {
        return Inertia::render('category-import/index');
    }
}
