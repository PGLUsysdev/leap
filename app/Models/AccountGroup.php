<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountGroup extends Model
{
    /** @use HasFactory<\Database\Factories\AccountGroupFactory> */
    use HasFactory;

    protected $fillable = ['uacs_digit', 'name', 'normal_balance'];
}
