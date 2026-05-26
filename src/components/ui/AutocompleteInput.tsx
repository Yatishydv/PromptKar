import React, { useState, useEffect, useRef } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AutocompleteInputProps {
  type: "users" | "prompts";
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function AutocompleteInput({ type, value, onChange, placeholder }: AutocompleteInputProps) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce the input value so we don't spam the API
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const url = type === "users" 
    ? (debouncedValue.length > 1 ? `/api/users?search=${debouncedValue}&limit=5` : null)
    : (debouncedValue.length > 2 ? `/api/prompts?search=${debouncedValue}&limit=5` : null);

  const { data: results } = useSWR(url, fetcher);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
      />
      {isOpen && results && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
          {results.map((item: any) => (
            <div
              key={item._id}
              onClick={() => {
                if (type === "users") {
                  onChange(item.username);
                } else {
                  onChange(item.slug || item._id);
                }
                setIsOpen(false);
              }}
              className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex flex-col"
            >
              <span className="font-bold text-slate-900 text-sm">
                {type === "users" ? item.username : item.title}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {type === "users" ? item.name : `Slug: ${item.slug}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
