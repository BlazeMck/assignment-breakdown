
export default function InputField({ type, name, placeholder="", value, onChange, error}) {
    return (
        <div className="flex flex-col">
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 ${error ? 'border-red-500' : ''}`}
            />
            {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
        </div>
    )
}