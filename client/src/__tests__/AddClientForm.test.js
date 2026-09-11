// AddClientForm.test.jsx

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddClientForm from "../components/AddClientForm";          // 🛣️ adjust if you place the test elsewhere
import axios from "axios";


// 🔌 Totally stub out toast so it doesn’t blow up the console
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// 🔌 Stub axios
jest.mock("axios");

beforeEach(() => {
  // fake token so the component’s axios call sees it
  localStorage.setItem("token", "FAKE_JWT");
  jest.clearAllMocks();
});

describe("AddClientForm", () => {
  test("renders heading, inputs, and button", () => {
    render(<AddClientForm onAdd={jest.fn()} />);
    expect(
      screen.getByRole("heading", { name: /add new client/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/client name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add client/i })).toBeInTheDocument();
  });

  test("shows validation errors for bad input", async () => {
    render(<AddClientForm onAdd={jest.fn()} />);

    // hit submit with everything empty
    userEvent.click(screen.getByRole("button", { name: /add client/i }));

    expect(await screen.findByText(/name is required/i)).toBeVisible();
    expect(await screen.findByText(/valid email/i)).toBeVisible();
    expect(await screen.findByText(/10-digit indian mobile/i)).toBeVisible();

    // email still wrong
    userEvent.type(screen.getByPlaceholderText(/email address/i), "bad@");
    expect(screen.getByText(/valid email/i)).toBeVisible();
  });

  test("fires axios POST and resets form on happy path", async () => {
    const onAdd = jest.fn();
    axios.post.mockResolvedValueOnce({ data: { ok: true } });

    render(<AddClientForm onAdd={onAdd} />);

    userEvent.type(screen.getByPlaceholderText(/client name/i), "Riya");
    userEvent.type(screen.getByPlaceholderText(/email address/i), "riya@example.com");
    userEvent.type(screen.getByPlaceholderText(/phone number/i), "9876543210");

    userEvent.click(screen.getByRole("button", { name: /add client/i }));

    await waitFor(() =>
  expect(screen.getByPlaceholderText(/client name/i)).toHaveValue("")
);

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:5000/api/clients/add",
      { name: "Riya", email: "riya@example.com", phone: "9876543210" },
      { headers: { Authorization: "Bearer FAKE_JWT" } }
    );
    expect(onAdd).toHaveBeenCalled(); // parent refresh hook

    // inputs should be wiped
    expect(screen.getByPlaceholderText(/client name/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/email address/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/phone number/i)).toHaveValue("");
  });
});
