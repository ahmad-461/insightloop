"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useSpring, useMotionValue, useTransform } from "framer-motion";

// 1. Thin Animated Scroll Progress Bar
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 z-[100] origin-left pointer-events-none"
      style={{ scaleX }}
    />
  );
}

// 2. Cursor Glow Component (CSS Transform-based, lightweight, disabled on touch/mobile)
export function CursorGlow() {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);
  const [visible, setVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    const touchQuery = window.matchMedia("(pointer: coarse)");
    setIsTouch(touchQuery.matches);

    if (touchQuery.matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - 150);
      mouseY.set(e.clientY - 150);
      if (!visible) setVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [visible, mouseX, mouseY]);

  if (isTouch || !visible) return null;

  return (
    <motion.div
      className="cursor-glow fixed top-0 left-0 w-[300px] h-[300px] rounded-full bg-accent/5 pointer-events-none z-40 blur-[80px]"
      style={{
        x: mouseX,
        y: mouseY,
      }}
    />
  );
}

// Helper: Hook or handler for local glow elements (following within card bounds)
export function useLocalGlow() {
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  return { handleMouseMove };
}

// 3. Aurora Background Component (GPU-optimized via translation/opacity only)
export function AuroraBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
  }, []);

  return (
    <div className="aurora-container absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle overlay radial gradient to contain light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,var(--bg)_100%)]" />

      {!reducedMotion ? (
        <div className="absolute inset-0 opacity-[0.14] dark:opacity-[0.11] filter blur-[100px]">
          {/* Cyan Glow */}
          <motion.div
            className="absolute top-[-10%] left-[-15%] w-[55%] h-[55%] rounded-full bg-cyan-400"
            animate={{
              x: ["0%", "15%", "-10%", "0%"],
              y: ["0%", "-10%", "12%", "0%"],
              scale: [1, 1.15, 0.9, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Purple Glow */}
          <motion.div
            className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500"
            animate={{
              x: ["0%", "-20%", "10%", "0%"],
              y: ["0%", "15%", "-15%", "0%"],
              scale: [1, 0.85, 1.1, 1],
            }}
            transition={{
              duration: 26,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Blue Glow */}
          <motion.div
            className="absolute bottom-[-15%] left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500"
            animate={{
              x: ["0%", "10%", "-15%", "0%"],
              y: ["0%", "-15%", "8%", "0%"],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Indigo Glow */}
          <motion.div
            className="absolute top-[35%] left-[35%] w-[45%] h-[45%] rounded-full bg-indigo-500"
            animate={{
              x: ["0%", "-12%", "18%", "0%"],
              y: ["0%", "10%", "-10%", "0%"],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      ) : (
        // Static layout for users preferring reduced motion
        <div className="absolute inset-0 opacity-[0.10] filter blur-[100px]">
          <div className="absolute top-0 left-0 w-[50%] h-[50%] rounded-full bg-cyan-400" />
          <div className="absolute top-[20%] right-0 w-[60%] h-[60%] rounded-full bg-purple-500" />
          <div className="absolute bottom-0 left-[20%] w-[50%] h-[50%] rounded-full bg-blue-500" />
        </div>
      )}
    </div>
  );
}

// 4. Floating AI Icons Component with Mouse Parallax (only on desktop non-touch)
export function FloatingAIIcons() {
  const [isTouch, setIsTouch] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for parallax lag
  const springX = useSpring(mouseX, { stiffness: 45, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 45, damping: 20 });

  // Multiply spring values to simulate layered depth
  const x1 = useTransform(springX, (v) => v * 1.0);
  const y1 = useTransform(springY, (v) => v * 1.0);

  const x2 = useTransform(springX, (v) => v * -1.3);
  const y2 = useTransform(springY, (v) => v * -1.3);

  const x3 = useTransform(springX, (v) => v * 0.7);
  const y3 = useTransform(springY, (v) => v * 0.7);

  const x4 = useTransform(springX, (v) => v * -0.5);
  const y4 = useTransform(springY, (v) => v * -0.5);

  useEffect(() => {
    const touchQuery = window.matchMedia("(pointer: coarse)");
    setIsTouch(touchQuery.matches);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);

    if (touchQuery.matches || motionQuery.matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / 50;
      const y = (e.clientY - window.innerHeight / 2) / 50;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Floating animation helpers
  const floatTransition = (delay: number, duration: number) => ({
    duration,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay,
  });

  const floatVariants = {
    animate: (custom: { x: number; y: number }) => ({
      x: [0, custom.x, -custom.x, 0],
      y: [0, custom.y, -custom.y, 0],
    }),
  };

  const SparklesIcon = () => (
    <svg className="w-8 h-8 text-accent/20 dark:text-blue-400/20 filter blur-[0.5px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L14 15l-5.096.813zM18.75 8.25l-.75 2.25-.75-2.25-2.25-.75 2.25-.75.75-2.25.75 2.25 2.25.75-2.25.75z" />
    </svg>
  );

  const NodeIcon = () => (
    <svg className="w-10 h-10 text-indigo-500/20 filter blur-[0.5px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <path d="M12 8v8M7 17l10-10M17 17L7 7" strokeDasharray="3 3" />
    </svg>
  );

  const ParticleIcon = () => (
    <div className="w-4 h-4 rounded-full bg-cyan-500/20 filter blur-[1px]" />
  );

  if (reducedMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div className="absolute top-[20%] left-[10%] opacity-50"><SparklesIcon /></div>
        <div className="absolute top-[35%] right-[15%] opacity-40"><NodeIcon /></div>
        <div className="absolute bottom-[25%] left-[25%] opacity-50"><ParticleIcon /></div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Sparkles Top Left */}
      <motion.div
        className="absolute top-[18%] left-[12%] floating-ai-icon"
        style={{ x: isTouch ? 0 : x1, y: isTouch ? 0 : y1 }}
        animate="animate"
        variants={floatVariants}
        custom={{ x: 12, y: 16 }}
        transition={floatTransition(0, 9)}
      >
        <SparklesIcon />
      </motion.div>

      {/* Nodes Right Center */}
      <motion.div
        className="absolute top-[30%] right-[12%] floating-ai-icon"
        style={{ x: isTouch ? 0 : x2, y: isTouch ? 0 : y2 }}
        animate="animate"
        variants={floatVariants}
        custom={{ x: -16, y: 12 }}
        transition={floatTransition(2, 11)}
      >
        <NodeIcon />
      </motion.div>

      {/* Particle Bottom Left */}
      <motion.div
        className="absolute bottom-[28%] left-[20%] floating-ai-icon"
        style={{ x: isTouch ? 0 : x3, y: isTouch ? 0 : y3 }}
        animate="animate"
        variants={floatVariants}
        custom={{ x: 10, y: -20 }}
        transition={floatTransition(4, 8)}
      >
        <ParticleIcon />
      </motion.div>

      {/* Sparkles Bottom Right */}
      <motion.div
        className="absolute bottom-[18%] right-[22%] floating-ai-icon"
        style={{ x: isTouch ? 0 : x4, y: isTouch ? 0 : y4 }}
        animate="animate"
        variants={floatVariants}
        custom={{ x: -10, y: -14 }}
        transition={floatTransition(6, 10)}
      >
        <SparklesIcon />
      </motion.div>
    </div>
  );
}

// 5. Magnetic Button Wrapper with smooth spring physics & ripple effect on click
export function MagneticButton({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 120, damping: 14 });
  const springY = useSpring(y, { stiffness: 120, damping: 14 });

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reducedMotion || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();

    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const moveX = (clientX - centerX) * 0.32;
    const moveY = (clientY - centerY) * 0.32;

    x.set(moveX);
    y.set(moveY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  const [ripples, setRipples] = useState<{ id: number; style: React.CSSProperties }[]>([]);

  const handleRippleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick();

    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const xPos = e.clientX - rect.left - size / 2;
    const yPos = e.clientY - rect.top - size / 2;

    const newRipple = {
      id: Date.now(),
      style: {
        top: yPos,
        left: xPos,
        width: size,
        height: size,
      },
    };

    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleRippleClick}
      className={`relative overflow-hidden group select-none ${className}`}
      style={{
        x: hovered && !reducedMotion ? springX : 0,
        y: hovered && !reducedMotion ? springY : 0,
      }}
      whileHover={{ scale: reducedMotion ? 1 : 1.02 }}
      whileTap={{ scale: reducedMotion ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 450, damping: 20 }}
    >
      <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-300" />

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/20 animate-ripple pointer-events-none block"
          style={ripple.style}
        />
      ))}

      <span className="relative z-10 flex items-center justify-center gap-1.5">{children}</span>
    </motion.button>
  );
}
