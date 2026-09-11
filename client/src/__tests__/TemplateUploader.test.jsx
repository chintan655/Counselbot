// TemplateUploader.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TemplateUploader from "../components/TemplateUploader";   // ← tweak if needed
import axios from "axios";

/* ────── global mocks ────── */
jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem("token", "FAKE_JWT");
});

const authHdr = { headers: { Authorization: "Bearer FAKE_JWT" } };

/* ────── tests ────── */
describe("TemplateUploader", () => {
  test("uploads a template and fires onUploadSuccess", async () => {
    const onUpload = jest.fn();
    axios.post.mockResolvedValueOnce({ data: { path: "/uploads/template.docx" } });

    const { container } = render(<TemplateUploader onUploadSuccess={onUpload} />);

    // grab hidden file input
    const input = container.querySelector('input[type="file"]');
    const fakeFile = new File(["dummy"], "template.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    await userEvent.upload(input, fakeFile);

    userEvent.click(screen.getByRole("button", { name: /upload template/i }));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5000/api/templates/upload",
        expect.any(FormData),
        authHdr
      )
    );
    expect(onUpload).toHaveBeenCalledWith("/uploads/template.docx");
  });

  test("shows error toast when no file selected", () => {
    const { error } = require("react-hot-toast");
    render(<TemplateUploader onUploadSuccess={jest.fn()} />);

    userEvent.click(screen.getByRole("button", { name: /upload template/i }));
    expect(error).toHaveBeenCalledWith("Choose a template first");
    expect(axios.post).not.toHaveBeenCalled();
  });
});
