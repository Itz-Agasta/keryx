import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { COLORS } from "../theme/colors.js";

type PanelType = "tree" | "data" | "query";

interface KeyboardHint {
  key: string;
  label: string;
}

interface KeyboardHintsProps {
  activePanel: PanelType;
  isQueryPanelOpen?: boolean;
}

/**
 * Context-aware keyboard hints that change based on current panel/mode
 */
export const KeyboardHints: React.FC<KeyboardHintsProps> = ({
  activePanel,
  isQueryPanelOpen = false,
}) => {
  const hints = useMemo((): KeyboardHint[] => {
    // Query panel open - show query-specific hints
    if (isQueryPanelOpen) {
      return [
        { key: "Ctrl+Enter", label: "Execute" },
        { key: "Ctrl+K", label: "Clear" },
        { key: "Ctrl+P", label: "Performance" },
        { key: "Esc", label: "Close" },
      ];
    }

    // Browse mode - hints depend on focused panel
    const baseHints: KeyboardHint[] = [
      { key: "Q", label: "Query" },
      { key: "Tab", label: "Switch Panel" },
    ];

    if (activePanel === "tree") {
      return [
        { key: "↑↓", label: "Navigate" },
        { key: "→←", label: "Expand/Collapse" },
        { key: "Enter", label: "Select" },
        ...baseHints,
        { key: "R", label: "Refresh" },
      ];
    }

    if (activePanel === "data") {
      return [
        { key: "↑↓←→", label: "Scroll" },
        { key: "I", label: "Info" },
        ...baseHints,
      ];
    }

    return baseHints;
  }, [activePanel, isQueryPanelOpen]);

  return (
    <Box justifyContent="center" paddingX={1}>
      <Text color={COLORS.textMuted}>
        {hints.map((hint, index) => (
          <React.Fragment key={hint.key}>
            <Text color={COLORS.text}>{hint.key}</Text>
            <Text color={COLORS.textMuted}> {hint.label}</Text>
            {index < hints.length - 1 && (
              <Text color={COLORS.textMuted}> • </Text>
            )}
          </React.Fragment>
        ))}
        <Text color={COLORS.textMuted}> • </Text>
        <Text color={COLORS.text}>Ctrl+C</Text>
        <Text color={COLORS.textMuted}> Quit</Text>
      </Text>
    </Box>
  );
};

export default KeyboardHints;
