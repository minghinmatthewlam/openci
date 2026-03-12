"use client";

import { useState } from "react";

export function CopyCommand({ value }: { value: string }): React.ReactNode {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  function fallbackCopy(text: string): boolean {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }

    return copied;
  }

  async function handleCopy(): Promise<void> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (!fallbackCopy(value)) {
        throw new Error("Copy failed");
      }

      setStatus("copied");
    } catch {
      const copied = fallbackCopy(value);
      setStatus(copied ? "copied" : "error");
    }

    window.setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    <button
      className={`command-box ${status === "error" ? "command-box-error" : ""}`}
      type="button"
      onClick={handleCopy}
      aria-label={
        status === "copied" ? "Copied" : status === "error" ? "Copy failed" : "Copy to clipboard"
      }
    >
      <span className="command-value">{value}</span>
      <span className="command-icon">
        {status === "copied" ? "COPIED" : status === "error" ? "FAILED" : "COPY"}
      </span>
    </button>
  );
}
