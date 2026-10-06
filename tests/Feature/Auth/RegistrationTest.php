<?php

use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('it creates a pending account and signs the new user out', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    // New accounts await administrator approval, so they cannot sign in yet.
    expect(User::where('email', 'test@example.com')->sole()->status)->toBe('pending');

    $this->assertGuest();
    $response->assertRedirect(route('register', absolute: false))
        ->assertSessionHas('status', 'awaiting-approval');
});
