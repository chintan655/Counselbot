import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import NotesSection from "../components/NotesSection"; // Update if path differs
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

// Mock axios
jest.mock("axios");

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock jsPDF
jest.mock("jspdf", () => {
  return jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    save: jest.fn(),
    addPage: jest.fn(),
    splitTextToSize: jest.fn((text, width) => text.split("\n")),
    internal: { pageSize: { height: 300 } }
  }));
});

describe("NotesSection Component", () => {
  const dummyNotes = [
    { id: 1, note_text: "Test Note 1", created_at: "2025-06-30T10:00:00Z" },
    { id: 2, note_text: "Test Note 2", created_at: "2025-06-30T11:00:00Z" },
  ];

  const dummyClient = {
    id: "abc123",
    name: "John Doe",
    email: "john@example.com",
    phone: "1234567890",
  };

  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => "mock-token");

    // Mock notes
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/notes/byClient")) {
        return Promise.resolve({ data: dummyNotes });
      }
      if (url.includes("/api/clients/my")) {
        return Promise.resolve({ data: [dummyClient] });
      }
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  test("renders notes and allows adding a new note", async () => {
    render(<NotesSection clientId="abc123" />);

    await waitFor(() => {
      expect(screen.getByText("Test Note 1")).toBeInTheDocument();
      expect(screen.getByText("Test Note 2")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Write a note...");
    fireEvent.change(textarea, { target: { value: "New note from test" } });

    const addButton = screen.getByText("Add Note");
    axios.post.mockResolvedValueOnce({}); // mock add note
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5000/api/notes/add",
        { client_id: "abc123", note_text: "New note from test" },
        expect.any(Object)
      );
    });
  });

  test("edit button sets note text", async () => {
    render(<NotesSection clientId="abc123" />);
    await waitFor(() => screen.getByText("Test Note 1"));

    const editButtons = screen.getAllByTitle("Edit Note");
    fireEvent.click(editButtons[0]);

    const textarea = screen.getByPlaceholderText("Write a note...");
    expect(textarea.value).toBe("Test Note 1");
  });

  test("delete note works after confirm", async () => {
    window.confirm = jest.fn(() => true);
    axios.delete.mockResolvedValueOnce({});

    render(<NotesSection clientId="abc123" />);
    await waitFor(() => screen.getByText("Test Note 1"));

    const deleteButtons = screen.getAllByTitle("Delete Note");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:5000/api/notes/delete/1",
        expect.any(Object)
      );
    });
  });

  test("generates document and allows saving", async () => {
    axios.post.mockImplementation((url) => {
      if (url.includes("/api/generate")) {
        return Promise.resolve({ data: { text: "Generated Legal Doc Content" } });
      }
      if (url.includes("/api/documents/save")) {
        return Promise.resolve({ data: { success: true } });
      }
    });

    render(<NotesSection clientId="abc123" />);
    await waitFor(() => screen.getByText("Test Note 1"));

    const generateBtn = screen.getByText("Generate Document");
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText("📄 Generated Document")).toBeInTheDocument();
      expect(screen.getByText("Generated Legal Doc Content")).toBeInTheDocument();
    });

    const saveBtn = screen.getByText("Save Document");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("📄 Document saved successfully!");
    });
  });

  test("downloads PDF", async () => {
    render(<NotesSection clientId="abc123" />);
    await waitFor(() => screen.getByText("Test Note 1"));

    // Set fake document state
    fireEvent.click(screen.getByText("Generate Document"));
    axios.post.mockResolvedValue({
      data: { text: "Mock PDF text content" },
    });

    await waitFor(() => {
      expect(screen.getByText("Download PDF")).toBeInTheDocument();
    });

    const downloadBtn = screen.getByText("Download PDF");
    fireEvent.click(downloadBtn);

    expect(jsPDF).toHaveBeenCalled();
  });

  test("shows error when note is empty", async () => {
    render(<NotesSection clientId="abc123" />);
    await waitFor(() => screen.getByText("Test Note 1"));

    const addButton = screen.getByText("Add Note");
    fireEvent.click(addButton);

    expect(toast.error).toHaveBeenCalledWith("Note can't be empty!");
  });
});
