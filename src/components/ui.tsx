import React, { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Button Primitive
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-sm text-xs uppercase tracking-widest font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37] disabled:pointer-events-none disabled:opacity-50 min-h-[44px] md:min-h-0",
          {
            "bg-white text-black hover:bg-[#D4AF37] h-11 md:h-10 px-6 py-2": variant === 'primary',
            "bg-[#161616] text-[#E5E5E5] border border-white/10 hover:bg-white/5 h-11 md:h-10 px-6 py-2": variant === 'secondary',
            "border border-white/20 text-[#E5E5E5] hover:bg-white/5 h-11 md:h-10 px-6 py-2": variant === 'outline',
            "hover:bg-white/5 text-[#E5E5E5] h-11 md:h-10 px-4 py-2": variant === 'ghost',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// Input Primitive
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 md:h-10 w-full rounded-sm border border-white/20 bg-[#0A0A0A] px-3 py-2 text-sm text-[#E5E5E5] placeholder-[#707070] font-light focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] md:min-h-0",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// Card Primitive
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-sm border border-white/5 bg-[#161616] text-[#E5E5E5] shadow-xl", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn("text-sm font-light tracking-[0.2em] uppercase text-white", className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

export function Label({ className, htmlFor, children }: { className?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={cn("text-[10px] uppercase tracking-widest text-[#707070]", className)}>
      {children}
    </label>
  );
}
