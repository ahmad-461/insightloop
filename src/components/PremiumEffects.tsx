"use client";

import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

// 1. Thin Corporate Scroll Progress Bar (2px, solid accent color, no gradients)
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-accent z-[100] origin-left pointer-events-none"
      style={{ scaleX }}
    />
  );
}

// 2. Cursor Glow Component (Disabled for clean enterprise aesthetic)
export function CursorGlow() {
  return null;
}

// Helper: Hook for local glow elements (disabled/do-nothing for Phase 20)
export function useLocalGlow() {
  const handleMouseMove = () => {};
  return { handleMouseMove };
}

// 3. Aurora Background Component (Disabled for clean enterprise aesthetic)
export function AuroraBackground() {
  return null;
}

// 4. Floating AI Icons Component (Disabled for clean enterprise aesthetic)
export function FloatingAIIcons() {
  return null;
}

// 5. Standard Confident Button Component (solid fill, clear simple transition on hover, no spring physics)
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
      className={`relative overflow-hidden group select-none transition-all duration-200 active:scale-95 hover:brightness-110 active:brightness-95 ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-1.5">{children}</span>
    </button>
  );
}
