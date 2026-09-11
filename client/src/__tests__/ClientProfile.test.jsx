// ClientProfile.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClientProfile from "../components/ClientProfile"; // Adjust path if needed
import axios from "axios";

/* ─────────── Mocks ─────────── */
// kill toast chatter
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// stub NotesSection & FileUploader (already tested separately)
jest.mock("../components/NotesSection", () => () => <div data-testid="notes" />);
jest.mock("../components/FileUploader", () => () => <div data-testid="uploader" />);

// axios stub
jest.mock("axios");

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem("token", "FAKE_JWT");
  jest.spyOn(window, "confirm").mockReturnValue(true); // always "yes"
});

/* helper to mock GET per endpoint */
const mockAxiosGet = ({ client, docs = [], files = [] }) => {
  axios.get.mockImplementation((url) => {
    if (url.includes("/clients/my")) {
      return Promise.resolve({ data: [client] });
    }
    if (url.includes("/documents/byClient")) {
      return Promise.resolve({ data: docs });
    }
    if (url.includes("/files/byClient")) {
      return Promise.resolve({ data: files });
    }
    return Promise.resolve({ data: [] });
  });
};

describe("ClientProfile", () => {
  const baseClient = {
    id: 1,
    name: "Priya Patel",
    email: "priya@demo.com",
    phone: "9876543210",
  };

  const sampleDocs = [
    {
      id: 11,
      doc_type: "NDA",
      content: "This is a sample NDA content",
      created_at: new Date().toISOString(),
    },
  ];

  test("loads client info & shows Notes/File sections", async () => {
    mockAxiosGet({ client: baseClient, docs: sampleDocs });

    render(
      <ClientProfile
        clientId={1}
        onBack={() => {}}
        refreshClients={() => {}}
      />
    );

    expect(await screen.findByText(/client profile/i)).toBeInTheDocument();
    expect(screen.getByText(/priya patel/i)).toBeInTheDocument();

    // Notes and uploader mock stubs
    expect(screen.getByTestId("notes")).toBeInTheDocument();
    expect(screen.getByTestId("uploader")).toBeInTheDocument();
  });

  test("enter edit mode, validate, and save data", async () => {
    mockAxiosGet({ client: baseClient });
    axios.put.mockResolvedValue({}); // mock PUT success

    render(
      <ClientProfile
        clientId={1}
        onBack={() => {}}
        refreshClients={() => {}}
      />
    );

    await screen.findByText(/client profile/i);

    userEvent.click(screen.getByRole("button", { name: /edit/i }));

    const emailInput = screen.getByPlaceholderText(/email/i);
    userEvent.clear(emailInput);
    userEvent.type(emailInput, "bad@");

    userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(await screen.findByText(/valid email/i)).toBeVisible();

    userEvent.clear(emailInput);
    userEvent.type(emailInput, "new@example.com");
    userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "http://localhost:5000/api/clients/1",
        expect.objectContaining({ email: "new@example.com" }),
        { headers: { Authorization: "Bearer FAKE_JWT" } }
      )
    );
  });

  test("toggle docs list and delete a document", async () => {
    mockAxiosGet({ client: baseClient, docs: sampleDocs });
    axios.delete.mockResolvedValue({});

    render(
      <ClientProfile
        clientId={1}
        onBack={() => {}}
        refreshClients={() => {}}
      />
    );

    await screen.findByText(/client profile/i);

    userEvent.click(screen.getByRole("button", { name: /show documents/i }));

    const ndaTitles = await screen.findAllByText(/nda/i);
    expect(ndaTitles[0]).toBeInTheDocument();

    // 🛠️ Use getByTitle because button has only a title, not text
    const deleteButtons = screen.getAllByTitle(/delete document/i);
    userEvent.click(deleteButtons[0]);

    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents/11",
        { headers: { Authorization: "Bearer FAKE_JWT" } }
      )
    );
  });
});
