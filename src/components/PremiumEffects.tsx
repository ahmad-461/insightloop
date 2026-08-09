"use client";

import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

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

// 2. Subtle, professional static mesh pattern replacing AuroraBackground
export function AuroraBackground() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_60%,transparent_100%)] opacity-[0.25] dark:opacity-[0.15] pointer-events-none z-0" />
  );
}

// 3. Removed playful floating animations (safe dead-code replacement returning null)
export function FloatingAIIcons() {
  return null;
}

// 4. Premium Corporate Button replacing MagneticButton & ripple effect
export function MagneticButton({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden transition-all duration-200 hover:brightness-105 active:scale-98 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-1.5">{children}</span>
    </button>
  );
}
