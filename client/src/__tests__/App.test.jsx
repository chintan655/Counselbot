import React from 'react';

import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import App from "../App";
import { AuthContext } from "../AuthContext";

/* ------------------------------------------------------------------ */
/*  🔧 Mocks – keep the UI light & predictable                         */
/* ------------------------------------------------------------------ */
jest.mock("../Register", () => () => <div>Register Page</div>);
jest.mock("../Login", () => () => <div>Login Page</div>);
jest.mock("../SavedDocs", () => () => <div>Saved Documents</div>);
jest.mock("../components/Chatbot", () => () => <div>Chatbot Component</div>);
jest.mock("../components/ClientList", () => () => <div>Client List</div>);
jest.mock("../components/ClientProfile", () => () => <div>Client Profile</div>);
jest.mock("../components/FileUploader", () => () => <div>File Uploader</div>);
jest.mock("../components/TemplateUploader", () => () => (
  <div>TemplateUploader Component</div>
));

/* ------------------------------------------------------------------ */
/*  🔧 Helper – render App with/without an authenticated user          */
/* ------------------------------------------------------------------ */
const renderWithAuth = (user = null) =>
  render(
    <AuthContext.Provider value={{ user, logout: jest.fn() }}>
      <App />
    </AuthContext.Provider>
  );

/* ------------------------------------------------------------------ */
/*  🧪  Tests                                                         */
/* ------------------------------------------------------------------ */
describe("App Component", () => {
  test("renders Login page when no user is logged in", () => {
    renderWithAuth(null);
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });
  

  test("renders Register page when nav register is clicked", async () => {
    renderWithAuth(null);
    fireEvent.click(screen.getAllByText("Register")[0]);
    expect(await screen.findByText(/Register Page/i)).toBeInTheDocument();
  });

  test("renders dashboard and Client List when user is logged in", () => {
    renderWithAuth({ name: "Test User" });
    expect(screen.getByText(/Welcome, Test User!/i)).toBeInTheDocument();
    expect(screen.getByText(/Client List/i)).toBeInTheDocument();
  });

  test("navigates to Chatbot via mobile drawer nav", async () => {
    renderWithAuth({ name: "Test User" });

    // open mobile drawer
    fireEvent.click(screen.getByLabelText(/toggle navigation/i));
    const drawer = screen.getByRole("complementary", { name: /mobile drawer/i });

    // click Chatbot inside the drawer
    fireEvent.click(within(drawer).getByText("Chatbot"));

    expect(
      await screen.findByText(/Chatbot Component/i)
    ).toBeInTheDocument();
  });

  test("navigates to Saved Documents via mobile drawer nav", async () => {
    renderWithAuth({ name: "Test User" });

    fireEvent.click(screen.getByLabelText(/toggle navigation/i));
    const drawer = screen.getByRole("complementary", { name: /mobile drawer/i });

    // click the Saved Documents button inside the drawer
    fireEvent.click(within(drawer).getByText("Saved Documents"));

    // wait for the *content* div (not the nav buttons) to appear
    const savedDocsDiv = await screen.findByText(/Saved Documents/i, {
      selector: "div",
    });
    expect(savedDocsDiv).toBeInTheDocument();
  });

  test("shows TemplateUploader in template mode", async () => {
    renderWithAuth({ name: "Test User" });

    // navigate to Generate Docs via mobile drawer
    fireEvent.click(screen.getByLabelText(/toggle navigation/i));
    const drawer = screen.getByRole("complementary", { name: /mobile drawer/i });
    fireEvent.click(within(drawer).getByText("Generate Docs"));

    // switch to “Fill Template” mode
    fireEvent.click(screen.getByLabelText(/Fill Template/i));

    expect(
      await screen.findByText(/TemplateUploader Component/i)
    ).toBeInTheDocument();
  });

  test("shows doc type select in smart mode", async () => {
    renderWithAuth({ name: "Test User" });

    // navigate to Generate Docs via mobile drawer
    fireEvent.click(screen.getByLabelText(/toggle navigation/i));
    const drawer = screen.getByRole("complementary", { name: /mobile drawer/i });
    fireEvent.click(within(drawer).getByText("Generate Docs"));

    // smart (AI Draft) mode is default – just assert the combobox exists
    const select = await screen.findByRole("combobox");
    expect(select).toBeInTheDocument();
  });
});
