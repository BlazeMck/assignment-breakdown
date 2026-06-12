import { test, expect } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from '@testing-library/react';
import Signup from '../../src/pages/Signup.jsx';

test('validates signup form inputs', async () => {
    
    // Renders component natively in the browser DOM
    render(<Signup />);

    // Simulates blank form submission
    const submitButton = page.getByRole('button', { name: /Sign Up/i });
    await userEvent.click(submitButton);

    // Expects validation errors to be displayed
    expect(page.getByText(/First name required/i)).toBeVisible();
    expect(page.getByText(/Last name required/i)).toBeVisible();
    expect(page.getByText(/Email required/i)).toBeVisible();
    expect(page.getByText(/Password must have:/i)).toBeVisible();

    // Simulates valid form submission
    await userEvent.type(page.getByPlaceholder(/First Name/i), 'John');
    await userEvent.type(page.getByPlaceholder(/Last Name/i), 'Doe');
    await userEvent.type(page.getByPlaceholder(/Email Address/i), 'john.doe@example.com');
    await userEvent.type(page.getByPlaceholder(/^Password$/), 'P@ssword123');
    await userEvent.type(page.getByPlaceholder(/Confirm Password/i), 'P@ssword123');
    
    await userEvent.click(submitButton);

    // Expects no validation errors to be displayed
    const errorMessages = [
        page.getByText(/First name required/i),
        page.getByText(/Last name required/i),
        page.getByText(/Email required/i),
        page.getByText(/Password must have:/i),
        page.getByText(/Passwords do not match/i)
    ]
    for (const errorMessage of errorMessages) {
        await expect (errorMessage).not.toBeInTheDocument();
    }

    // Simulates password mismatch
    await userEvent.clear(page.getByPlaceholder(/Confirm Password/i));
    await userEvent.type(page.getByPlaceholder(/Confirm Password/i), 'D!fferent123');
    await userEvent.click(submitButton);

    // Expects password mismatch error to be displayed
    expect(page.getByText(/Passwords do not match/i)).toBeVisible();
})