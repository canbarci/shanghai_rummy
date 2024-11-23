import React from "react";
import {BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import GamePage from "./pages/GamePage.tsx";
import WaitingRoomPage from "./pages/WaitingRoomPage.tsx";
import WelcomePage from "./pages/WelcomePage.tsx";
import { initializeApp } from "firebase/app";


const firebaseConfig = {
  apiKey: "AIzaSyDNjjcDt7-DLgjtNPHMd7lr6mLQO_ytZd0",
  authDomain: "shanghai-rummy-671bf.firebaseapp.com",
  databaseURL: "https://shanghai-rummy-671bf-default-rtdb.firebaseio.com",
  projectId: "shanghai-rummy-671bf",
  storageBucket: "shanghai-rummy-671bf.firebasestorage.app",
  messagingSenderId: "1023674467713",
  appId: "1:1023674467713:web:84229e26554028e3ab5480"
};

initializeApp(firebaseConfig);

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
