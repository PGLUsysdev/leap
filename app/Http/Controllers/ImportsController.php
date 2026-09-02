<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class ImportsController extends Controller
{
    public function index()
    {
        return Inertia::render('imports/index');
    }
}
