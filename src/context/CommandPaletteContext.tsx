"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface CommandPaletteContextType {
  isOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType>({
  isOpen: false,
  openPalette: () => {},
  closePalette: () => {},
  togglePalette: () => {},
});

export const useCommandPalette = () => useContext(CommandPaletteContext);

export const CommandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openPalette = useCallback(() => setIsOpen(true), []);
  const closePalette = useCallback(() => setIsOpen(false), []);
  const togglePalette = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <CommandPaletteContext.Provider value={{ isOpen, openPalette, closePalette, togglePalette }}>
      {children}
    </CommandPaletteContext.Provider>
  );
};
