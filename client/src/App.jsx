import { BrowserRouter, Routes, Route, Link } from 'react-router';
import { useAuth } from "./context/AuthContext.js"
import Navbar from './components/Navbar.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Welcome from './pages/Welcome.jsx';
import SubmitAssignment from './pages/SubmitAssignment.jsx';
import { AuthProvider } from './context/AuthContext.js';

export default function App() {
    

    return (
        <AuthProvider>
            <BrowserRouter>
            {/* NAVBAR SECTION */}
            <Navbar />
            <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/submit" element={<SubmitAssignment />} />
            </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}