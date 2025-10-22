import React from 'react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string; // for accessibility if no visible label
  id?: string; // optional id if you want to associate with external label
}

/**
 * CustomCheckbox
 * 
 * Accessible, keyboard-navigable custom checkbox component.
 * - Visually hides native checkbox but keeps it accessible.
 * - Displays custom styled checkbox box.
 * - Uses aria-label or expects to be wrapped in a label for screen readers.
 */
const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  id,
}) => {
  return (
    <label
      htmlFor={id}
      className={`relative inline-flex items-center cursor-pointer ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      }`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only" // hide native checkbox but keep accessible
        aria-label={ariaLabel}
      />
      <span
        className={`w-5 h-5 rounded border border-gray-500 flex items-center justify-center
          transition-colors duration-150
          ${
            checked
              ? 'bg-cyan-600 border-cyan-600'
              : 'bg-transparent border-gray-500 hover:border-cyan-500'
          }
          ${disabled ? 'bg-gray-700 border-gray-600' : ''}
          focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500
        `}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
    </label>
  );
};

export default CustomCheckbox;
