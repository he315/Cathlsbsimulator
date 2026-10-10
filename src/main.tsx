import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

// development only: the realism capture harness (window.__xrayCapture; docs/realism/wave1/S0.md)
if (import.meta.env.DEV) void import("./dev/xrayCapture").then((m) => m.installXrayCapture());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
