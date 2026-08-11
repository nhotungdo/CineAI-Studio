'use client';

import { useEffect, useState } from 'react';

interface Petal {
  id: number;
  left: number;
  animationDuration: number;
  delay: number;
  size: number;
}

export function SakuraBackground() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    // Generate initial petals
    const newPetals: Petal[] = [];
    const numPetals = 20; // Subtle amount
    
    for (let i = 0; i < numPetals; i++) {
      newPetals.push({
        id: i,
        left: Math.random() * 100, // random start x pos
        animationDuration: 10 + Math.random() * 15, // 10s to 25s
        delay: Math.random() * 15, // random start delay
        size: 0.5 + Math.random() * 0.8, // subtle sizes
      });
    }
    
    setPetals(newPetals);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="sakura-petal"
          style={{
            left: `${petal.left}%`,
            width: `${15 * petal.size}px`,
            height: `${22 * petal.size}px`,
            animationDuration: `${petal.animationDuration}s`,
            animationDelay: `${petal.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
