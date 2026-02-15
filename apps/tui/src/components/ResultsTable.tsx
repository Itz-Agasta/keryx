import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";
import type { QueryResult } from "../types/index.js";

interface ResultsTableProps {
  result: QueryResult;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ result }) => {
  const [scrollY, setScrollY] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const containerRef = useRef<{ rows: number; cols: number }>({ rows: 20, cols: 80 });

  useEffect(() => {
    // Get terminal size
    const rows = process.stdout.rows - 10 || 20;
    const cols = process.stdout.columns || 80;
    containerRef.current = { rows, cols };
  }, []);

  useInput((input, key) => {
    if (key.upArrow) {
      setScrollY((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setScrollY((prev) => Math.min(result.rows.length - 1, prev + 1));
    }
    if (key.leftArrow) {
      setScrollX((prev) => Math.max(0, prev - 1));
    }
    if (key.rightArrow) {
      setScrollX((prev) => Math.min(result.columns.length - 1, prev + 1));
    }
  });

  if (result.rows.length === 0) {
    return (
      <Box>
        <Text color="gray">No results</Text>
      </Box>
    );
  }

  const visibleColumns = result.columns.slice(scrollX, scrollX + 5);
  const visibleRows = result.rows.slice(scrollY, scrollY + containerRef.current.rows);

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        {visibleColumns.map((col, idx) => (
          <Box key={col.name} width={20} borderStyle="single" paddingX={1}>
            <Text bold color="cyan">
              {idx === 0 && scrollX > 0 ? "..." : col.name.slice(0, 18)}
            </Text>
          </Box>
        ))}
        {result.columns.length > scrollX + 5 && (
          <Box paddingX={1}>
            <Text color="gray">...</Text>
          </Box>
        )}
      </Box>

      {/* Rows */}
      {visibleRows.map((row, rowIdx) => (
        <Box key={rowIdx}>
          {row.slice(scrollX, scrollX + 5).map((cell, cellIdx) => (
            <Box key={cellIdx} width={20} paddingX={1}>
              <Text color={rowIdx % 2 === 0 ? "white" : "gray"}>
                {cellIdx === 0 && scrollX > 0 ? "..." : String(cell ?? "NULL").slice(0, 18)}
              </Text>
            </Box>
          ))}
        </Box>
      ))}

      {/* Scroll indicator */}
      {result.rows.length > containerRef.current.rows && (
        <Box marginTop={1}>
          <Text color="gray">
            Row {scrollY + 1} of {result.rows.length} (Use arrow keys to scroll)
          </Text>
        </Box>
      )}
    </Box>
  );
};
