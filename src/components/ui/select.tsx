import * as React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <select
        className={`block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Select.displayName = "Select";

export { Select };
