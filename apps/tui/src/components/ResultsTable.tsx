import React, { useState, useEffect } from "react";
import { Box, Text, useStdout } from "ink";
import type { QueryResult } from "../types/index.js";

interface ResultsTableProps {
  result: QueryResult;
  scrollY: number;
  scrollX: number;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ result, scrollY, scrollX }) => {
  const { stdout } = useStdout();
  const [visibleRows, setVisibleRows] = useState(20);

  useEffect(() => {
    setVisibleRows((stdout.rows || 24) - 10);
    const handleResize = () => {
      setVisibleRows((stdout.rows || 24) - 10);
    };
    stdout.on("resize", handleResize);
    return () => {
      stdout.off("resize", handleResize);
    };
  }, [stdout]);

  if (result.rows.length === 0) {
    return (
      <Box>
        <Text color="gray">No results</Text>
      </Box>
    );
  }

  const visibleColumns = result.columns.slice(scrollX, scrollX + 5);
  const visibleRowData = result.rows.slice(scrollY, scrollY + visibleRows);

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
      {visibleRowData.map((row, rowIdx) => (
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
      {result.rows.length > visibleRows && (
        <Box marginTop={1}>
          <Text color="gray">
            Row {scrollY + 1} of {result.rows.length} (Use arrow keys to scroll)
          </Text>
        </Box>
      )}
    </Box>
  );
};
