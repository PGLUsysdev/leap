<?php

test('redirects the root to the login screen', function () {
    $this->get('/')->assertRedirect(route('login'));
});
