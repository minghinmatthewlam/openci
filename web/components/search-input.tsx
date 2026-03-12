"use client";

import { useEffect, useRef } from "react";

export function SearchInput({ defaultValue }: { defaultValue?: string }): React.ReactNode {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key !== "/") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form className="search-form">
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          className="search-input"
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Search workflows..."
          aria-label="Search workflows"
        />
        <kbd className="search-kbd">/</kbd>
      </div>
      <button className="search-button" type="submit">
        Search
      </button>
    </form>
  );
}
