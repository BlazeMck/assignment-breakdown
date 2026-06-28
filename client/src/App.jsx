import { BrowserRouter, Routes, Route } from 'react-router';
import Navbar from './components/Navbar.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Welcome from './pages/Welcome.jsx';
import SubmitAssignment from './pages/SubmitAssignment.jsx';
import ViewAssignments from './pages/ViewAssignments.jsx';
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
                <Route path="/assignments" element={<ViewAssignments />} />
            </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}