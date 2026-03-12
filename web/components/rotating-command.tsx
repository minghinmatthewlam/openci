"use client";

import { useEffect, useState } from "react";
import { CopyCommand } from "./copy-command";

const COMMANDS = [
  "npx openci add minghinmatthewlam/openci --workflow pr-review --provider claude",
  "npx openci search review",
  "npx openci list",
  "npx openci status",
];

const INTERVAL_MS = 3500;

export function RotatingCommand(): React.ReactNode {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % COMMANDS.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rotating-command">
      <CopyCommand value={COMMANDS[index]} />
      <div className="rotating-dots">
        {COMMANDS.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`rotating-dot${i === index ? " rotating-dot-active" : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`Show command ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
