export default function FormInput({ label, error, icon: Icon, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-body font-medium text-ru-charcoal">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ru-muted pointer-events-none" />
        )}
        <input
          {...props}
          className={`input-field ${Icon ? 'pl-10' : ''} ${error ? 'border-red-400 focus:border-red-500' : ''}`}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-body">{error}</p>}
    </div>
  )
}
