export default function Button({ 
        type="button", 
        children, 
        onClick, 
        disabled, 
        className = "" 
}) {
    return (
        <button 
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={className + " rounded-md bg-blue-500 text-white p-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed"}
        >
            {children}
        </button>
    )
}