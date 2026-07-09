<?php

namespace App\Models;

use Database\Factories\AccountGroupFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountGroup extends Model
{
    /** @use HasFactory<AccountGroupFactory> */
    use HasFactory;

    protected $fillable = ['uacs_digit', 'name', 'normal_balance'];
}
