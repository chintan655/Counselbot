
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import { AuthProvider } from "./AuthContext";
// import reportWebVitals from './reportWebVitals';

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <AuthProvider>
//     <App />
//   </AuthProvider>
// );
// reportWebVitals();
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./AuthContext"; // ✅ correct import
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>

  </AuthProvider>

);
