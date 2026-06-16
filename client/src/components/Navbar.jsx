import { Link } from "react-router"
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { user, logout } = useAuth()

    return (
        <nav className="bg-white dark:bg-gray-800 shadow px-4 py-4 flex justify-center space-x-4 items-center">
            <Link to="/" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">Home</Link>
            {user ?
            (<><Link to="/submit" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">Submit Assignment</Link>
            <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">Sign Out</button></>) :
            (<><Link to="/signup" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">Sign Up</Link> 
            <Link to="/login" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">Login</Link></> ) }
        </nav>
    )
}