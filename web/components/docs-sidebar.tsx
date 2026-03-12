import Link from "next/link";
import { docsSections } from "../lib/site";

export function DocsSidebar({ current }: { current: string }): React.ReactNode {
  return (
    <aside className="docs-sidebar">
      {docsSections.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className={section.href === current ? "docs-link active" : "docs-link"}
          prefetch={false}
        >
          {section.label}
        </Link>
      ))}
    </aside>
  );
}
