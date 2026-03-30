import { useState, useCallback } from "react";

export type PanelType = "tree" | "data" | "query";

interface UsePanelFocusOptions {
  initialPanel?: PanelType;
  panels?: PanelType[];
}

interface UsePanelFocusReturn {
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
  focusNext: () => void;
  focusPrevious: () => void;
  isActive: (panel: PanelType) => boolean;
}

/**
 * Hook for managing focus between panels with Tab navigation
 * 
 * Usage:
 * ```tsx
 * const { activePanel, focusNext, isActive } = usePanelFocus();
 * 
 * useInput((input, key) => {
 *   if (key.tab) focusNext();
 * });
 * ```
 */
export function usePanelFocus(
  options: UsePanelFocusOptions = {}
): UsePanelFocusReturn {
  const {
    initialPanel = "tree",
    panels = ["tree", "data"],
  } = options;

  const [activePanel, setActivePanel] = useState<PanelType>(initialPanel);

  const focusNext = useCallback(() => {
    setActivePanel((current) => {
      const currentIndex = panels.indexOf(current);
      const nextIndex = (currentIndex + 1) % panels.length;
      return panels[nextIndex]!;
    });
  }, [panels]);

  const focusPrevious = useCallback(() => {
    setActivePanel((current) => {
      const currentIndex = panels.indexOf(current);
      const prevIndex = (currentIndex - 1 + panels.length) % panels.length;
      return panels[prevIndex]!;
    });
  }, [panels]);

  const isActive = useCallback(
    (panel: PanelType) => activePanel === panel,
    [activePanel]
  );

  return {
    activePanel,
    setActivePanel,
    focusNext,
    focusPrevious,
    isActive,
  };
}

export default usePanelFocus;
