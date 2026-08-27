import React, { useEffect, useRef } from 'react';

interface CampusHeroCanvasProps {
  className?: string;
  nodeCount?: number;
}

export const CampusHeroCanvas: React.FC<CampusHeroCanvasProps> = ({
  className = '',
  nodeCount = 36,
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
      let width = (canvas.width = canvas.offsetWidth || 800);
      let height = (canvas.height = canvas.offsetHeight || 240);

      let mouseX = -1000;
      let mouseY = -1000;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      };

      const handleMouseLeave = () => {
        mouseX = -1000;
        mouseY = -1000;
      };

      window.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);

      const handleResize = () => {
        if (!canvas) return;
        width = canvas.width = canvas.offsetWidth || 800;
        height = canvas.height = canvas.offsetHeight || 240;
      };

      window.addEventListener('resize', handleResize);

      const tricolorPalette = [
        'rgba(249, 115, 22,', // Saffron
        'rgba(37, 99, 235,',  // Chakra Blue
        'rgba(22, 163, 74,',  // India Green
        'rgba(249, 115, 22,', // Saffron
        'rgba(37, 99, 235,',  // Chakra Blue
        'rgba(22, 163, 74,',  // India Green
      ];

      const nodes = Array.from({ length: nodeCount }, (_, i) => ({
        x: Math.random() * (width || 800),
        y: Math.random() * (height || 240),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        baseRadius: Math.random() * 2 + 1.2,
        radius: Math.random() * 2 + 1.2,
        opacity: Math.random() * 0.45 + 0.35,
        colorPrefix: tricolorPalette[i % tricolorPalette.length],
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

          // Draw connections between close nodes
          for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
              const b = nodes[j];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < 110) {
                const alpha = (1 - dist / 110) * 0.18;
                ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
          }

          // Update and render nodes
          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            
            // Mouse interactive parallax push
            const mdx = n.x - mouseX;
            const mdy = n.y - mouseY;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 80) {
              const force = (1 - mdist / 80) * 2;
              n.x += (mdx / mdist) * force;
              n.y += (mdy / mdist) * force;
            }

            n.x += n.vx;
            n.y += n.vy;

            if (n.x < 0 || n.x > width) n.vx *= -1;
            if (n.y < 0 || n.y > height) n.vy *= -1;

            ctx.fillStyle = `${n.colorPrefix} ${n.opacity})`;
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
        window.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
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
