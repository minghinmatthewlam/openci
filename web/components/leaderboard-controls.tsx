'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { LeaderboardView } from '../lib/leaderboard';

const views: Array<{ label: string; value: LeaderboardView }> = [
  { label: 'All Time', value: 'all-time' },
  { label: 'Trending (24h)', value: 'trending' },
  { label: 'Hot', value: 'hot' },
];

export function LeaderboardControls({
  initialQuery,
  initialView,
}: {
  initialQuery?: string;
  initialView: LeaderboardView;
}): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery ?? '');

  function navigate(nextView: LeaderboardView, nextQuery: string): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', nextView);

    if (nextQuery.trim()) {
      params.set('q', nextQuery.trim());
    } else {
      params.delete('q');
    }

    router.push(`/?${params.toString()}`);
  }

  return (
    <>
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault();
          navigate(initialView, query);
        }}
      >
        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search workflows..."
          aria-label="Search workflows"
        />
        <button className="search-button" type="submit">
          Search
        </button>
      </form>

      <div className="view-tabs" role="tablist" aria-label="Leaderboard views">
        {views.map((entry) => (
          <button
            key={entry.value}
            type="button"
            className={entry.value === initialView ? 'view-tab active' : 'view-tab'}
            onClick={() => navigate(entry.value, query)}
          >
            {entry.label}
          </button>
        ))}
      </div>
    </>
  );
}
