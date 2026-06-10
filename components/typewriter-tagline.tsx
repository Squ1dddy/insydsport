'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const messages = [
  "Don't Die Gully!",
  'Abhi Is NO SKILL',
  'The Headers are out!',
  'Level 8 are trash',
  'Watch out for the Demolition Men',
  'No friends on the court',
  'Break 2 starts now. Are you ready?',
  "The amphitheatre doesn't forget",
  'Every point counts. Every game matters.',
  'Season 1. No do-overs.',
  'Legends are made at lunch',
  "You trained for this. Or you didn't. Good luck either way.",
  'The bracket has no mercy'
];

export function TypewriterTagline() {
  const [text, setText] = useState('');

  useEffect(() => {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    let i = 0;
    const interval = setInterval(() => {
      setText(randomMessage.slice(0, i + 1));
      i++;
      if (i === randomMessage.length) clearInterval(interval);
    }, 40);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-6 flex max-w-2xl items-center gap-3"
    >
      <span className="shrink-0 rounded-md border border-flare/40 bg-flare/10 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-flare">
        Courtside
      </span>
      <p className="flex items-center font-mono text-base font-medium leading-relaxed text-bone/90 lg:text-lg">
        {text}
        <motion.span
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ repeat: Infinity, duration: 0.9, times: [0, 0.5, 0.5, 1] }}
          className="ml-1 inline-block h-5 w-2.5 bg-volt"
        />
      </p>
    </motion.div>
  );
}
