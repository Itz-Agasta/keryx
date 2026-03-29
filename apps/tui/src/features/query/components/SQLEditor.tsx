import React, { useState, useCallback, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { COLORS } from "../../../shared/theme/colors.js";
import type { QueryResult } from "../../../types/index.js";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  onClear: () => void;
  isFocused: boolean;
  isExecuting: boolean;
  placeholder?: string;
  history: string[];
  historyIndex: number;
  onHistoryNavigate: (direction: "up" | "down") => void;
}

/**
 * SQL editor component with history navigation
 */
export const SQLEditor: React.FC<SQLEditorProps> = ({
  value,
  onChange,
  onExecute,
  onClear,
  isFocused,
  isExecuting,
  placeholder = "Enter SQL query...",
  history,
  historyIndex,
  onHistoryNavigate,
}) => {
  // Handle keyboard shortcuts
  useInput(
    (input, key) => {
      if (!isFocused) return;

      // Ctrl+Enter to execute
      if (key.ctrl && key.return) {
        onExecute();
        return;
      }

      // Ctrl+K to clear
      if (key.ctrl && input === "k") {
        onClear();
        return;
      }

      // Arrow up/down for history (when at start/end of input)
      if (key.upArrow && history.length > 0) {
        onHistoryNavigate("up");
        return;
      }
      if (key.downArrow && historyIndex >= 0) {
        onHistoryNavigate("down");
        return;
      }
    },
    { isActive: isFocused }
  );

  return (
    <Box flexDirection="column">
      {/* Editor header */}
      <Box>
        <Text color={COLORS.primary} bold>
          SQL Query
        </Text>
        {history.length > 0 && (
          <Text color={COLORS.textMuted} dimColor>
            {" "}(↑↓ history: {history.length})
          </Text>
        )}
      </Box>

      {/* Input area */}
      <Box
        borderStyle="single"
        borderColor={isFocused ? COLORS.borderFocus : COLORS.border}
        paddingX={1}
        marginTop={1}
      >
        {isExecuting ? (
          <Text color={COLORS.warning}>Executing...</Text>
        ) : (
          <TextInput
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            focus={isFocused}
          />
        )}
      </Box>

      {/* Hints */}
      <Box marginTop={1}>
        <Text color={COLORS.textMuted} dimColor>
          <Text color={COLORS.text}>Ctrl+Enter</Text> Execute
          <Text color={COLORS.textMuted}> • </Text>
          <Text color={COLORS.text}>Ctrl+K</Text> Clear
        </Text>
      </Box>
    </Box>
  );
};

export default SQLEditor;
