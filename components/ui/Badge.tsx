import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  const baseStyles = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2";
  
  let variantStyles = "";
  switch (variant) {
    case 'secondary':
      variantStyles = "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200/80";
      break;
    case 'outline':
      variantStyles = "text-slate-950 border-slate-200";
      break;
    default: // default
      variantStyles = "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80";
      break;
  }

  return (
    <span className={`${baseStyles} ${variantStyles} ${className || ''}`} {...props} />
  );
};