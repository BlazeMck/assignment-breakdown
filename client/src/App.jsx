import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Welcome from "./pages/Welcome";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import SubmitAssignment from "./pages/SubmitAssignment";
import ViewAssignments from "./pages/ViewAssignments"
import AssignmentView from "./pages/AssignmentView";
import Dashboard from "./pages/Dashboard";

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                {/* GLOBAL NAVBAR */}
                <Navbar />
                
                <Routes>
                    {/* Project Dashboard */}
                    <Route path="/" element={<Dashboard />} />
    
                    {/* Authentication Paths */}
                    <Route path="/welcome" element={<Welcome />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />
    
                    {/* Core Assignment Utilities */}
                    <Route path="/submit" element={<SubmitAssignment />} />
                    
                    {/* Empty or broken assignment paths before they can crash the view */}
                    {/* <Route path="/assignments" element={<Navigate to="/" replace />} />
                    <Route path="/assignments/" element={<Navigate to="/" replace />} /> */}
                    
                    {/* This route stays safe for valid IDs */}
                    <Route path="/assignments" element={<ViewAssignments />} />
                    
                    {/* Global fallback safety net */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}