import React from "react";
import { cn } from "../../../../lib/utils";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 text-blue-900 border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
};

export default RadioGroup;
