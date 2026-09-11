<?php

use App\Services\ChartOfAccountClassifier;

test('it maps uacs paths to expense classes', function () {
    expect(ChartOfAccountClassifier::fromPath('5-01-01-010'))->toBe('PS')
        ->and(ChartOfAccountClassifier::fromPath('5-02-03-010'))->toBe('MOOE')
        ->and(ChartOfAccountClassifier::fromPath('5-03-01-010'))->toBe('FE')
        ->and(ChartOfAccountClassifier::fromPath('1-07-05-020'))->toBe('CO');
});

test('it accepts space separated codes and parent prefixes', function () {
    expect(ChartOfAccountClassifier::fromPath('5 02 03 010'))->toBe('MOOE')
        ->and(ChartOfAccountClassifier::fromPath('5-02'))->toBe('MOOE')
        ->and(ChartOfAccountClassifier::fromPath('1-07'))->toBe('CO');
});

test('it returns null for blank or unmapped paths', function () {
    expect(ChartOfAccountClassifier::fromPath(null))->toBeNull()
        ->and(ChartOfAccountClassifier::fromPath(''))->toBeNull()
        ->and(ChartOfAccountClassifier::fromPath('1-01-01-010'))->toBeNull()
        ->and(ChartOfAccountClassifier::fromPath('5-02X'))->toBeNull();
});
