import { useAuth } from "../context/AuthContext"

export default function Welcome() {
    const {user} = useAuth();
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-white dark:bg-gray-800 px-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">Welcome {user?.uuid ? `${user.firstName} ${user.lastName} ` : ''}to Breakdown!</h1>
            <p className="text-lg text-slate-700 dark:text-gray-300 mb-4">Your one-stop solution for task and project management.</p>
        </div>
    )
}