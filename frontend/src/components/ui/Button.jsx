import React, { forwardRef } from 'react';
import Spinner from './Spinner';

const variants = {
  primary:
    'bg-pitch-navy text-white hover:bg-slate-800 active:bg-slate-900 shadow-sm border border-transparent',
  secondary:
    'bg-pitch-surface-1 text-pitch-blue hover:bg-pitch-surface-2 active:bg-pitch-surface-3 border border-pitch-surface-2',
  blue:
    'bg-pitch-blue text-white hover:bg-pitch-blue-hover active:bg-blue-700 shadow-sm border border-transparent',
  outline:
    'bg-white text-pitch-text border border-pitch-outline-variant hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100',
  ghost:
    'bg-transparent text-pitch-text hover:bg-slate-100 active:bg-slate-200 border border-transparent',
  danger:
    'bg-pitch-error text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-transparent',
  link:
    'bg-transparent text-pitch-blue hover:underline p-0 h-auto border-none focus-visible:ring-0',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5 font-medium',
  md: 'px-4 py-2 text-sm rounded-lg gap-2 font-medium',
  lg: 'px-5 py-2.5 text-base rounded-lg gap-2.5 font-semibold',
  icon: 'p-2 text-sm rounded-lg',
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-blue focus-visible:ring-offset-2 ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.md} ${
        isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner
            size="sm"
            color={variant === 'primary' || variant === 'blue' || variant === 'danger' ? 'white' : 'primary'}
          />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

export default Button;
