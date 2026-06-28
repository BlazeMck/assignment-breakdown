import { useEffect } from "react"
import { Link } from "react-router"
import { useAuth } from "../context/AuthContext";
import { getUserBreakdowns } from "../api/assignments";

export default function Navbar() {
    const { user, logout } = useAuth()

    // When a user logs in, pull their saved assignments + tasks and log them
    // so we can verify the correct data is associated with the user.
    useEffect(() => {
        if (!user?.uuid) return;

        getUserBreakdowns(user.uuid)
            .then((breakdowns) => {
                console.log(`Assignments for user ${user.uuid}:`, breakdowns);
                breakdowns.forEach((a) => {
                    console.log(`  Assignment: "${a.title}" (due ${a.due_date})`);
                    a.tasks.forEach((t) =>
                        console.log(`    ${t.priority}. ${t.description} [effort ${t.time_estimate}, ${t.status}]`),
                    );
                });
            })
            .catch((err) => console.error("Failed to load user breakdowns:", err));
    }, [user?.uuid]);

    return (
        <nav className="bg-white dark:bg-gray-800 shadow px-4 py-4 flex justify-center space-x-4 items-center">
            <Link to="/" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">Home</Link>
            {user ? (
                <>
                    <Link to="/submit" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">Submit Assignment</Link>
                    <Link to="/assignments" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">My Assignments</Link>
                    <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">Sign Out</button>
                </>
            ) : (
                <>
                    <Link to="/signup" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">Sign Up</Link>
                    <Link to="/login" className="text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                </>
            )}
        </nav>
    )
}