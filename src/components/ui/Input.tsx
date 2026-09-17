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
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400 dark:text-gray-500">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`h-12 w-full rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-gray-200 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-navy-900 ${icon ? 'pl-10' : 'pl-4'} ${endAdornment ? 'pr-11' : 'pr-4'} ${className}`}
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
