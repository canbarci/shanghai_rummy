import React from "react";
import {BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import GamePage from "./pages/GamePage.tsx";
import WaitingRoomPage from "./pages/WaitingRoomPage.tsx";
import WelcomePage from "./pages/WelcomePage.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/waitingroom" element={<WaitingRoomPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
