'use client';

import { useState } from 'react';

/**
 * Mobile only. The six "what it asks" cards were the longest block on the
 * phone, so CSS hides all but the first three and this reveals the rest.
 * Desktop never sees the button — the grid shows everything already.
 */
export default function AskMore({ targetId }) {
  const [open, setOpen] = useState(false);
  return (
    <p className="ask-more">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={targetId}
        onClick={() => {
          const grid = document.getElementById(targetId);
          if (grid) grid.classList.toggle('open');
          setOpen((v) => !v);
        }}
      >
        {open ? 'Show less' : 'Three more things it does'}
      </button>
    </p>
  );
}
