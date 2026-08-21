import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function FormInput({ label, error, icon: Icon, type, ...props }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

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
          type={inputType}
          {...props}
          className={`input-field ${Icon ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''} ${error ? 'border-red-400 focus:border-red-500' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ru-muted hover:text-ru-charcoal transition-colors p-0.5"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-body">{error}</p>}
    </div>
  )
}
