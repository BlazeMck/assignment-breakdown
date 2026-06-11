import { test, expect } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from '@testing-library/react';
import Login from '../../src/pages/Login.jsx';

test ('validates login form inputs', async () => {

    // Renders component natively in the browser DOM
    render(<Login />);

    // Simulates blank form submission
    const submitButton = page.getByRole('button', { name: /Login/i})
    await userEvent.click(submitButton);

    // Expects validation errors to be displayed
    expect(page.getByText(/Email is required/i)).toBeVisible();
    expect(page.getByText(/Password is required/i)).toBeVisible();

    // Simulates valid form submission
    await userEvent.clear(page.getByPlaceholder(/Email Address/i));
    await userEvent.type(page.getByPlaceholder(/Email Address/i), 'john.doe@example.com');
    await userEvent.type(page.getByPlaceholder(/Password/i), 'P@ssword123');
    await userEvent.click(submitButton);

    // Expects no validation errors to be displayed
    const errorMessages = [
        page.getByText(/Email Required/i),
        page.getByText(/Password Required/i),
        page.getByText(/Invalid email format/i)
    ]
    for (const errorMessage of errorMessages) {
        await expect (errorMessage).not.toBeInTheDocument();
    }
})