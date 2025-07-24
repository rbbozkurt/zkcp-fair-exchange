import React, { useState } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// Simplified props interface
interface SecretInputFieldProps {
  value: string;
  onGenerateClicked: () => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  maxLength?: number;
}

export const SecretInputField: React.FC<SecretInputFieldProps> = ({
  value,
  onGenerateClicked,
  placeholder = 'Secret (used for encryption)',
  name = 'secret',
  disabled = false,
  maxLength = 64,
}) => {
  const [internalVisibility, setInternalVisibility] = useState(false);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(value);
    alert('Secret copied to clipboard!');
  };

  const toggleVisibility = () => {
    const newVisibility = !internalVisibility;
    setInternalVisibility(newVisibility);
  };

  return (
    <>
      <div className="relative flex items-center">
        <input
          name={name}
          className="bg-black/20 backdrop-blur-lg text-white border-2 border-white rounded px-4 py-2 pr-32 w-full placeholder-white"
          placeholder={placeholder}
          type={internalVisibility ? 'text' : 'password'}
          value={value}
          required
          maxLength={maxLength}
          disabled={false}
        />

        {/* Button group */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {/* Toggle visibility button */}
          <button
            type="button"
            className="p-2 rounded-full bg-black/10 text-zinc-300 hover:bg-transparent hover:text-white transition border-0 focus:outline-none"
            onClick={toggleVisibility}
            tabIndex={-1}
            disabled={disabled}
            aria-label={internalVisibility ? 'Hide secret' : 'Show secret'}
          >
            {internalVisibility ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>

          {/* Generate secret button - Moved here */}
          <button
            type="button"
            className="p-2 rounded-full bg-black/10 text-zinc-300 hover:bg-transparent hover:text-white transition border-0 focus:outline-none"
            onClick={onGenerateClicked}
            tabIndex={-1}
            disabled={disabled}
            aria-label="Generate new secret"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>

          {/* Copy to clipboard button */}
          <button
            type="button"
            className="p-2 rounded-full bg-black/10 text-zinc-300 hover:bg-transparent hover:text-white transition border-0 focus:outline-none"
            onClick={handleCopySecret}
            tabIndex={-1}
            disabled={disabled || !value}
            aria-label="Copy secret"
          >
            <ClipboardDocumentIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex justify-between text-xs text-white px-1">
        <span>
          {value.length}/{maxLength}
        </span>
      </div>
    </>
  );
};
