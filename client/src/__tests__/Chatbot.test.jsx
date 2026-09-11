import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Chatbot from "../components/Chatbot"; // Adjust path as needed
import axios from "axios";

// ✅ MOCK TOAST
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// ✅ MOCK AXIOS
jest.mock("axios");

// ✅ MOCK scrollIntoView & speech recognition
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();

  class FakeSpeechRecognition {
    start = jest.fn();
    stop = jest.fn();
    onstart = null;
    onend = null;
    onerror = null;
    onresult = null;
  }

  global.SpeechRecognition = FakeSpeechRecognition;
  global.webkitSpeechRecognition = FakeSpeechRecognition;
});

// ✅ RESET Mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem("token", "FAKE_JWT");
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });
  window.dispatchEvent(new Event("resize"));
});

describe("Chatbot Component", () => {
  const mockSessions = [
    { id: "s1", title: "Landlord query", created_at: Date.now(), client_name: null, is_pinned: false },
    { id: "s2", title: "Contract basics", created_at: Date.now(), client_name: null, is_pinned: false },
  ];

  test("loads and displays chat history on mount", async () => {
    axios.get.mockResolvedValueOnce({ data: mockSessions });

    render(<Chatbot />);

    expect(await screen.findByText(/landlord query/i)).toBeInTheDocument();
    expect(screen.getByText(/contract basics/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /legal chatbot/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start new chat/i })).toBeInTheDocument();
  });

  test("sends a user message and shows bot reply", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    axios.post.mockResolvedValueOnce({
      data: { response: "Sure, here’s a basic NDA.", sessionId: "xyz123" },
    });

    render(<Chatbot />);

    const input = screen.getByPlaceholderText(/ask about any legal topic/i);
    await userEvent.type(input, "Write an NDA{enter}");

    // ✅ There may be more than one "Write an NDA", so filter only message pane
    const allYouMessages = await screen.findAllByText((content, node) =>
      node.textContent.toLowerCase().includes("you") &&
      node.textContent.toLowerCase().includes("write an nda")
    );
    expect(allYouMessages.length).toBeGreaterThan(0);

    // ✅ Check bot reply
    expect(
      await screen.findByText(/basic nda/i)
    ).toBeInTheDocument();

    // ✅ Check Axios POST
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5000/api/chat",
        {
          message: "Write an NDA",
          history: [],
          sessionId: null,
        },
        { headers: { Authorization: "Bearer FAKE_JWT" } }
      )
    );
  });

  test("Start New Chat clears message pane", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    axios.post.mockResolvedValueOnce({
      data: { response: "Bot reply", sessionId: "abc" },
    });

    render(<Chatbot />);

    await userEvent.type(screen.getByPlaceholderText(/ask about any legal topic/i), "Hello{enter}");

    expect(await screen.findByText(/bot reply/i)).toBeInTheDocument();
    expect(screen.getAllByText(/you:/i).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: /start new chat/i }));

    await waitFor(() => {
      expect(screen.queryByText(/you:/i)).not.toBeInTheDocument();
    });
  });
});
