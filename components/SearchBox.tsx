
"use client";

import { useState } from "react";

type SearchBoxProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

export default function SearchBox({
  value = "",
  onChange,
  placeholder = "Search your memories...",
}: SearchBoxProps) {
  const [internalValue, setInternalValue] = useState(value);

  const searchValue = onChange ? value : internalValue;

  const handleChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <div className="tm-searchbox">
      <span className="tm-searchbox-icon">⌕</span>

      <input
        type="text"
        value={searchValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search memories"
      />

      {searchValue && (
        <button
          type="button"
          className="tm-searchbox-clear"
          onClick={() => handleChange("")}
          aria-label="Clear search"
        >
          ×
        </button>
      )}

      <style jsx>{`
        .tm-searchbox {
          width: 100%;
          height: 52px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 15px;
          background: #ffffff;
          border: 1px solid #e4e5e8;
          border-radius: 13px;
          box-sizing: border-box;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .tm-searchbox:focus-within {
          border-color: #cfd1d6;
          box-shadow: 0 0 0 3px rgba(23, 25, 30, 0.05);
        }

        .tm-searchbox-icon {
          flex: 0 0 auto;
          color: #8b8f97;
          font-size: 21px;
          line-height: 1;
        }

        .tm-searchbox input {
          width: 100%;
          min-width: 0;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #17191e;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
        }

        .tm-searchbox input::placeholder {
          color: #a1a4aa;
        }

        .tm-searchbox-clear {
          flex: 0 0 auto;
          width: 27px;
          height: 27px;
          border: 0;
          border-radius: 50%;
          background: #f0f1f3;
          color: #686c74;
          display: grid;
          place-items: center;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          padding: 0;
        }

        .tm-searchbox-clear:hover {
          background: #e7e8eb;
          color: #17191e;
        }
      `}</style>
    </div>
  );
}

