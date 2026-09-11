// FileUploader.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileUploader from "../components/FileUploader";   // ← adjust if needed
import axios from "axios";

/* ─── Global mocks ─── */
jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem("token", "FAKE_JWT");
  jest.spyOn(window, "confirm").mockReturnValue(true); // auto‑approve delete
});

/* Handy helper so we don’t repeat the header object */
const authHdr = { headers: { Authorization: "Bearer FAKE_JWT" } };

/* ─── Tests ─── */
describe("FileUploader", () => {
  const mockFiles = [
    { id: 1, original_name: "case.pdf",      file_path: "/uploads/case.pdf" },
    { id: 2, original_name: "affidavit.docx", file_path: "/uploads/affidavit.docx" },
  ];

  test("fetches and lists files on mount (client mode)", async () => {
    axios.get.mockResolvedValueOnce({ data: mockFiles });

    render(<FileUploader clientId={42} />);

    // wait for first file to show up
    expect(await screen.findByText(/case\.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/affidavit\.docx/i)).toBeInTheDocument();

    expect(axios.get).toHaveBeenCalledWith(
      "http://localhost:5000/api/files/byClient/42",
      authHdr
    );
  });

  test("uploads a file and refreshes the list", async () => {
    // 1️⃣ initial GET (empty list)
    axios.get.mockResolvedValueOnce({ data: [] });
    // 2️⃣ POST upload
    axios.post.mockResolvedValueOnce({ data: { ok: true } });
    // 3️⃣ GET after upload (returns mockFiles)
    axios.get.mockResolvedValueOnce({ data: mockFiles });

    const { container } = render(<FileUploader />); // personal mode

    // grab hidden file input the old‑school way
    const fileInput = container.querySelector('input[type="file"]');
    const fakeFile  = new File(["dummy"], "evidence.png", { type: "image/png" });

    await userEvent.upload(fileInput, fakeFile);
    userEvent.click(screen.getByRole("button", { name: /upload/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:5000/api/files/upload",
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer FAKE_JWT",
        }),
      })
    );

    // after refresh, files appear
    expect(await screen.findByText(/case\.pdf/i)).toBeInTheDocument();
  });

  test("deletes a file after confirmation", async () => {
    axios.get.mockResolvedValueOnce({ data: mockFiles });
    axios.delete.mockResolvedValueOnce({});          // delete ok
    // GET after delete returns empty list
    axios.get.mockResolvedValueOnce({ data: [] });

    render(<FileUploader clientId={99} />);

    // wait for initial list
    await screen.findByText(/case\.pdf/i);

    // click first "Delete" button
    userEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);

    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:5000/api/files/1",
        authHdr
      )
    );
    // list should eventually clear
    await waitFor(() =>
      expect(screen.queryByText(/case\.pdf/i)).not.toBeInTheDocument()
    );
  });
});
