"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCommandPalette } from "@/context/CommandPaletteContext";
import { Search, Home, LayoutDashboard, UploadCloud, Sparkles, Download, Save, Terminal, Cpu, Sun, Moon, CornerDownLeft } from "lucide-react";
import { useDuckDB } from "@/context/DuckDBContext";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions" | "Appearance";
  icon: React.ReactNode;
  action: () => void;
  requiresDataset?: boolean;
}

export default function CommandPalette() {
  const { isOpen, closePalette, togglePalette } = useCommandPalette();
  const router = useRouter();
  const pathname = usePathname();
  const { datasetLoaded } = useDuckDB();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Sync theme check on mount/actions
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, [isOpen]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("insightloop-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("insightloop-theme", "light");
    }
    closePalette();
  }, [theme, closePalette]);

  // List of all commands
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const commands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: "nav-home",
        title: "Go to Home",
        category: "Navigation",
        icon: <Home className="h-4 w-4" />,
        action: () => {
          router.push("/");
          closePalette();
        },
      },
      {
        id: "nav-dashboards",
        title: "Go to My Dashboards",
        category: "Navigation",
        icon: <LayoutDashboard className="h-4 w-4" />,
        action: () => {
          router.push("/dashboards");
          closePalette();
        },
      },
      {
        id: "nav-upload",
        title: "Go to Upload Portal",
        category: "Navigation",
        icon: <UploadCloud className="h-4 w-4" />,
        action: () => {
          if (pathname === "/") {
            const el = document.getElementById("upload-zone");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          } else {
            router.push("/?scroll=upload-zone");
          }
          closePalette();
        },
      },
      // Actions (Always there, but some are enabled only when dataset is loaded)
      {
        id: "act-ask-ai",
        title: "Ask AI a question",
        category: "Actions",
        icon: <Sparkles className="h-4 w-4" />,
        action: () => {
          if (pathname === "/" || pathname?.startsWith("/dashboards/")) {
            // Focus chat
            const chatInput = document.querySelector("textarea[placeholder*='Ask a question']") as HTMLTextAreaElement;
            if (chatInput) {
              const el = document.getElementById("chat-panel") || chatInput.closest(".border-t") || chatInput;
              el.scrollIntoView({ behavior: "smooth" });
              chatInput.focus();
            } else {
              // Trigger click if collapsed or dispatch custom event
              window.dispatchEvent(new CustomEvent("insightloop-focus-chat"));
            }
          } else {
            router.push("/?action=ask-ai");
          }
          closePalette();
        },
        requiresDataset: true,
      },
      {
        id: "act-pdf",
        title: "Export as PDF",
        category: "Actions",
        icon: <Download className="h-4 w-4" />,
        action: () => {
          window.dispatchEvent(new CustomEvent("insightloop-export-pdf"));
          closePalette();
        },
        requiresDataset: true,
      },
      {
        id: "act-save",
        title: "Save Dashboard",
        category: "Actions",
        icon: <Save className="h-4 w-4" />,
        action: () => {
          window.dispatchEvent(new CustomEvent("insightloop-save-dashboard"));
          closePalette();
        },
        requiresDataset: true,
      },
      {
        id: "act-sql",
        title: "Open Debug SQL Console",
        category: "Actions",
        icon: <Terminal className="h-4 w-4" />,
        action: () => {
          if (pathname === "/") {
            window.dispatchEvent(new CustomEvent("insightloop-open-sql"));
          } else {
            router.push("/?action=debug-sql");
          }
          closePalette();
        },
        requiresDataset: true,
      },
      {
        id: "act-insights",
        title: "Open Advanced Insights",
        category: "Actions",
        icon: <Cpu className="h-4 w-4" />,
        action: () => {
          if (pathname === "/") {
            window.dispatchEvent(new CustomEvent("insightloop-open-insights"));
          } else {
            router.push("/?action=advanced-insights");
          }
          closePalette();
        },
        requiresDataset: true,
      },
      // Theme
      {
        id: "theme-toggle",
        title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        category: "Appearance",
        icon: theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-700" />,
        action: toggleTheme,
      },
    ];

    // Filter based on whether dataset is loaded or not
    return list.filter((cmd) => {
      if (cmd.requiresDataset && !datasetLoaded) {
        return false;
      }
      return true;
    });
  }, [datasetLoaded, theme, pathname, router, closePalette, toggleTheme]);

  // Fuzzy match search filtering
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;
    const q = searchQuery.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [commands, searchQuery]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Capture previously focused element on open
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      // Focus search input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Key event bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        togglePalette();
        return;
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closePalette();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, closePalette, togglePalette]);

  // Handle Focus trapping
  const handleTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;

    const focusableElements = containerRef.current?.querySelectorAll(
      'input, button, [tabindex="0"]'
    );
    if (!focusableElements || focusableElements.length === 0) return;

    const first = focusableElements[0] as HTMLElement;
    const last = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };

  // Group commands by Category
  const grouped = filteredCommands.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  // Compute a single flat index list to align selections with grouped items
  const flatGroupedItems: CommandItem[] = [];
  const categories = Object.keys(grouped);
  categories.forEach((cat) => {
    flatGroupedItems.push(...grouped[cat]);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-background/60 backdrop-blur-xs">
      {/* Click outside to close */}
      <div className="absolute inset-0 z-0" onClick={closePalette} />

      {/* Main Palette Modal */}
      <div
        ref={containerRef}
        onKeyDown={handleTabKey}
        className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl z-10 flex flex-col overflow-hidden max-h-[450px]"
      >
        {/* Search Header */}
        <div className="flex items-center space-x-3 px-4 py-3.5 border-b border-border bg-surface/50">
          <Search className="h-4.5 w-4.5 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or navigate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted/30 outline-none w-full"
          />
          <span className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 text-muted font-bold font-mono">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted">
              No results found for &quot;{searchQuery}&quot;
            </div>
          ) : (
            categories.map((category) => (
              <div key={category} className="space-y-1">
                <span className="px-3 text-[9px] font-extrabold text-muted uppercase tracking-wider block mb-1">
                  {category}
                </span>

                <div className="space-y-0.5">
                  {grouped[category].map((cmd) => {
                    // Match visual flat selected index
                    const itemFlatIndex = flatGroupedItems.findIndex((item) => item.id === cmd.id);
                    const isSelected = itemFlatIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(itemFlatIndex)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left outline-none ${
                          isSelected
                            ? "bg-accent text-white"
                            : "text-foreground hover:bg-surface-subtle"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={isSelected ? "text-white" : "text-accent"}>
                            {cmd.icon}
                          </div>
                          <span className="font-medium">{cmd.title}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[9px] bg-white/20 px-1 py-0.5 rounded font-bold font-mono text-white flex items-center space-x-1">
                            <span>Select</span>
                            <CornerDownLeft className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-border bg-surface-subtle/50 text-[10px] text-muted flex justify-between items-center select-none font-medium">
          <span>Use arrows to navigate, Enter to select</span>
          <span>Phase 22 Enterprise Palette</span>
        </div>
      </div>
    </div>
  );
}
