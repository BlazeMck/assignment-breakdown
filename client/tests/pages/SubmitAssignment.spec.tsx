import { test, expect, afterEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/context/AuthContext.js';
import SubmitAssignment from '../../src/pages/SubmitAssignment.jsx';

// Browser-mode tests share the DOM, so unmount the previous render between
// tests to avoid duplicate elements.
afterEach(() => {
    cleanup();
});

// SubmitAssignment reads the logged-in user via useAuth(), so it must be
// rendered inside an AuthProvider. This helper logs a fake user in first so we
// can exercise the form's field validation (the page short-circuits with a
// "must be logged in" message when there is no user).
function LogInThenRender() {
    const { user, login } = useAuth();
    if (!user) {
        login({ firstName: 'Test', lastName: 'User', email: 't@example.com', uuid: 'firebaseUid_test' });
        return null;
    }
    return <SubmitAssignment />;
}

function renderLoggedIn() {
    render(
        <AuthProvider>
            <LogInThenRender />
        </AuthProvider>,
    );
}

test('blocks submission and asks the user to log in when not authenticated', async () => {
    render(
        <AuthProvider>
            <SubmitAssignment />
        </AuthProvider>,
    );

    await userEvent.click(page.getByRole('button', { name: 'Submit' }));

    await expect
        .element(page.getByText(/You must be logged in to submit an assignment/i))
        .toBeVisible();
});

test('shows validation errors when required fields are empty', async () => {
    renderLoggedIn();

    // Submit with both fields blank.
    await userEvent.click(page.getByRole('button', { name: 'Submit' }));

    // Both required-field errors should appear.
    await expect.element(page.getByText(/Assignment details are required/i)).toBeVisible();
    await expect.element(page.getByText(/A due date is required/i)).toBeVisible();
});

test('clears the details error once the field is filled', async () => {
    renderLoggedIn();

    // Trigger the errors first.
    await userEvent.click(page.getByRole('button', { name: 'Submit' }));
    await expect.element(page.getByText(/Assignment details are required/i)).toBeVisible();

    // Typing into the details field clears its error.
    await userEvent.type(
        page.getByPlaceholder(/Paste or describe your assignment/i),
        'Write a short essay about the water cycle.',
    );

    await expect
        .element(page.getByText(/Assignment details are required/i))
        .not.toBeInTheDocument();
});
