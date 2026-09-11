// ClientList.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClientList from "../components/ClientList";
import axios from "axios";

/* ────── Mocks ────── */
jest.mock("axios");

// mock lightweight child components
jest.mock("../components/AddClientForm", () => () => <div data-testid="add-client-form" />);
jest.mock("../components/ClientProfile", () => ({ clientId, onBack }) => (
  <div data-testid="client-profile">
    Profile for {clientId}
    <button onClick={onBack}>Back</button>
  </div>
));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem("token", "FAKE_JWT");
});

describe("ClientList", () => {
  const mockClients = [
    { id: 1, name: "Priya", email: "priya@ex.com", phone: "9876543210" },
    { id: 2, name: "Riya", email: "riya@ex.com", phone: "8765432109" },
  ];

 test("fetches and displays client cards", async () => {
  axios.get.mockResolvedValueOnce({ data: mockClients });

  render(<ClientList />);

  // Use getAllByText if multiple elements match
  const priyaMatches = await screen.findAllByText(/priya/i);
  expect(priyaMatches.length).toBeGreaterThan(0);

  const riyaMatches = await screen.findAllByText(/riya/i);
  expect(riyaMatches.length).toBeGreaterThan(0);

  // Check buttons
  const buttons = screen.getAllByRole("button", { name: /view profile/i });
  expect(buttons).toHaveLength(2);
  userEvent.click(buttons[0]);

  // Ensure axios called with correct auth header
  await waitFor(() =>
    expect(axios.get).toHaveBeenCalledWith(
      "http://localhost:5000/api/clients/my",
      { headers: { Authorization: "Bearer FAKE_JWT" } }
    )
  );
});


  test("clicking 'View Profile' swaps to ClientProfile and back", async () => {
    axios.get.mockResolvedValueOnce({ data: mockClients });

    render(<ClientList />);

    const buttons = await screen.findAllByRole("button", { name: /view profile/i });
    expect(buttons).toHaveLength(2);

    // Click first profile button (Priya)
    userEvent.click(buttons[0]);

    expect(await screen.findByTestId("client-profile")).toHaveTextContent("1");

    // Click Back
    userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText(/my clients/i)).toBeInTheDocument();
  });
});
