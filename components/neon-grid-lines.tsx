'use client';

import { useEffect, useState } from 'react';

interface NeonLine {
  id: number;
  direction: 'horizontal' | 'vertical';
  position: number;
  delay: number;
  duration: number;
}

export function NeonGridLines() {
  const [lines, setLines] = useState<NeonLine[]>(() => {
    // Função para criar uma nova linha aleatória
    const createRandomLine = (): NeonLine => {
      const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      const position = Math.floor(Math.random() * 20) * 48; // Múltiplos de 48px (tamanho do grid)
      const duration = 3 + Math.random() * 2; // 3s a 5s (mais devagar)
      
      return {
        id: Date.now() + Math.random(),
        direction,
        position,
        delay: 0,
        duration,
      };
    };
    
    return [createRandomLine()];
  });

  useEffect(() => {
    // Função para criar uma nova linha aleatória
    const createRandomLine = (): NeonLine => {
      const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      const position = Math.floor(Math.random() * 20) * 48; // Múltiplos de 48px (tamanho do grid)
      const duration = 3 + Math.random() * 2; // 3s a 5s (mais devagar)
      
      return {
        id: Date.now() + Math.random(),
        direction,
        position,
        delay: 0,
        duration,
      };
    };

    // Adicionar novas linhas em intervalos aleatórios
    const interval = setInterval(() => {
      const newLine = createRandomLine();
      
      setLines(prev => {
        // Manter apenas as últimas 3 linhas para performance
        const updated = [...prev, newLine];
        return updated.slice(-3);
      });
    }, 5000 + Math.random() * 3000); // Entre 5s e 8s (intervalo maior)

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {lines.map((line) => (
        <div
          key={line.id}
          className={`absolute ${
            line.direction === 'horizontal'
              ? 'h-px w-full left-0 animate-neon-scan-horizontal'
              : 'w-px h-full top-0 animate-neon-scan-vertical'
          }`}
          style={{
            [line.direction === 'horizontal' ? 'top' : 'left']: `${line.position}px`,
            background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.8), rgba(147, 51, 234, 1), rgba(168, 85, 247, 0.8), transparent)',
            boxShadow: '0 0 10px rgba(168, 85, 247, 0.8), 0 0 20px rgba(147, 51, 234, 0.6), 0 0 30px rgba(126, 34, 206, 0.4)',
            animationDuration: `${line.duration}s`,
            animationDelay: `${line.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
