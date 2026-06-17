'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const messages = [
  'Dont get out Gully!',
  'Abhi Is NO SKILL',
  'Level 8 Need to Lock in',
  'Watch out for the Demolition Men',
  'TIKI TAKA PHONK IS DIALED!!',
  'We Will Miss You Louis H :(',
  "Don't get Bento'ed",
  'You want to play? Lets Play!'
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
