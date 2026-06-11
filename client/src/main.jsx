import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Welcome from './pages/Welcome.jsx';
import './index.css';



createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  {/* NAVBAR SECTION */}
    <nav className="bg-white dark:bg-gray-800 shadow px-4 py-4 flex justify-center space-x-4">
      <Link to="/" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">Home</Link>
      <Link to="/signup" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">Sign Up</Link>
      <Link to="/login" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">Login</Link>
    </nav>
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  </BrowserRouter>
)
