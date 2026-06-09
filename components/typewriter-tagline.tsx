'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const messages = [
  "Don't Die Gully!",
  "Abhi Is NO SKILL",
  "The Headers are out!",
  "Level 8 are trash",
  "Watch out for the Demolition Men",
  "No friends on the court",
  "Break 2 starts now. Are you ready?",
  "The amphitheatre doesn't forget",
  "Every point counts. Every game matters.",
  "Season 1. No do-overs.",
  "Legends are made at lunch",
  "You trained for this. Or you didn't. Good luck either way.",
  "The bracket has no mercy"
];

export function TypewriterTagline() {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setMessage(randomMessage);
    
    let i = 0;
    const interval = setInterval(() => {
      setText(randomMessage.slice(0, i + 1));
      i++;
      if (i === randomMessage.length) clearInterval(interval);
    }, 40);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.p 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="mt-4 flex max-w-2xl items-center text-lg font-medium leading-relaxed text-slate-200 lg:text-xl"
    >
      {text}
      <motion.span 
        animate={{ opacity: [0, 1, 0] }} 
        transition={{ repeat: Infinity, duration: 0.8 }} 
        className="ml-1 inline-block h-6 w-0.5 bg-gold" 
      />
    </motion.p>
  );
}
