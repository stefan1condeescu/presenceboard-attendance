import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Participant from "./pages/Participant.jsx";
import ParticipantScan from "./pages/ParticipantScan.jsx";
import OrganizerLogin from "./pages/OrganizerLogin.jsx";
import OrganizerDashboard from "./pages/OrganizerDashboard.jsx";
import OrganizerGroup from "./pages/OrganizerGroup.jsx";
import OrganizerEvent from "./pages/OrganizerEvent.jsx";
import OrganizerRegister from "./pages/OrganizerRegister.jsx";

import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/participant" element={<Participant />} />
        <Route path="/participant/scan" element={<ParticipantScan />} />

        <Route path="/organizer/login" element={<OrganizerLogin />} />
        <Route path="/organizer/register" element={<OrganizerRegister />} />
        <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
        <Route path="/organizer/group/:groupId" element={<OrganizerGroup />} />
        <Route path="/organizer/event/:eventId" element={<OrganizerEvent />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
