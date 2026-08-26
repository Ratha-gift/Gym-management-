import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  endAdornment?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, endAdornment, className = '', ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`h-12 w-full rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/15 ${icon ? 'pl-10' : 'pl-4'} ${endAdornment ? 'pr-11' : 'pr-4'} ${className}`}
          {...props}
        />
        {endAdornment && (
          <span className="absolute inset-y-0 right-3.5 flex items-center">{endAdornment}</span>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export default Input
