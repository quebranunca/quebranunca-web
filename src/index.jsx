// src/index.jsx
import React from "react";
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import App from "./App";  // seu App.jsx com as rotas

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
    <AuthProvider>
     <BrowserRouter>
       <App />
     </BrowserRouter>
    </AuthProvider>
);