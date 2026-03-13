import * as React from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import App from "./App";
import "./styles.css";

function renderApp() {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <FluentProvider theme={webLightTheme}>
          <App />
        </FluentProvider>
      </React.StrictMode>
    );
  }
}

// Initialize Office.js
Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    renderApp();
  }
});

// Fallback: if Office.onReady doesn't fire within 5 seconds (e.g. certain
// Windows WebView environments), render the app anyway so the user doesn't
// see a blank white screen.
setTimeout(() => {
  const container = document.getElementById("root");
  if (container && !container.hasChildNodes()) {
    console.warn("Office.onReady did not fire in time, rendering app as fallback");
    renderApp();
  }
}, 5000);
