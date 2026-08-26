import React, { useEffect, useRef } from 'react';

interface CampusHeroCanvasProps {
  className?: string;
  nodeCount?: number;
}

export const CampusHeroCanvas: React.FC<CampusHeroCanvasProps> = ({
  className = '',
  nodeCount = 28,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (prefersReducedMotion) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      let animationFrameId: number;
      let width = (canvas.width = canvas.offsetWidth || 600);
      let height = (canvas.height = canvas.offsetHeight || 200);

      const handleResize = () => {
        if (!canvas) return;
        width = canvas.width = canvas.offsetWidth || 600;
        height = canvas.height = canvas.offsetHeight || 200;
      };

      window.addEventListener('resize', handleResize);

      const nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * (width || 600),
        y: Math.random() * (height || 200),
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1.2,
        opacity: Math.random() * 0.5 + 0.2,
      }));

      let isVisible = true;
      let observer: IntersectionObserver | null = null;

      if (typeof IntersectionObserver !== 'undefined') {
        observer = new IntersectionObserver((entries) => {
          if (entries && entries[0]) {
            isVisible = entries[0].isIntersecting;
          }
        });
        observer.observe(canvas);
      }

      const render = () => {
        if (isVisible && ctx && width > 0 && height > 0) {
          ctx.clearRect(0, 0, width, height);

          for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
              const b = nodes[j];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < 110) {
                const alpha = (1 - dist / 110) * 0.22;
                ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
          }

          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.x += n.vx;
            n.y += n.vy;

            if (n.x < 0 || n.x > width) n.vx *= -1;
            if (n.y < 0 || n.y > height) n.vy *= -1;

            ctx.fillStyle = `rgba(129, 140, 248, ${n.opacity})`;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        animationFrameId = requestAnimationFrame(render);
      };

      render();

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (observer) observer.disconnect();
      };
    } catch (e) {
      console.warn('CampusHeroCanvas error:', e);
    }
  }, [nodeCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 w-full h-full opacity-60 dark:opacity-75 ${className}`}
      aria-hidden="true"
    />
  );
};
