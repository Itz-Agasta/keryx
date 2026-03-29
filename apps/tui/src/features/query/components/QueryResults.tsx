import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { COLORS } from "../../../shared/theme/colors.js";
import type { QueryResult } from "../../../types/index.js";

interface QueryResultsProps {
  result: QueryResult | null;
  error: string | null;
  isExecuting: boolean;
  executionTime?: number;
  maxRows?: number;
}

/**
 * Display query results in a compact table format
 */
export const QueryResults: React.FC<QueryResultsProps> = ({
  result,
  error,
  isExecuting,
  executionTime,
  maxRows = 5,
}) => {
  // Calculate column widths
  const displayData = useMemo(() => {
    if (!result || result.rows.length === 0) return null;

    const columns = result.columns.slice(0, 5); // Max 5 columns in compact view
    const rows = result.rows.slice(0, maxRows);

    // Calculate widths
    const widths = columns.map((col, idx) => {
      let maxWidth = col.name.length;
      for (const row of rows) {
        const cellValue = String(row[idx] ?? "NULL");
        maxWidth = Math.max(maxWidth, cellValue.length);
      }
      return Math.min(maxWidth, 15);
    });

    return { columns, rows, widths };
  }, [result, maxRows]);

  // Executing state
  if (isExecuting) {
    return (
      <Box padding={1}>
        <Text color={COLORS.warning}>Executing query...</Text>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box padding={1} flexDirection="column">
        <Text color={COLORS.error}>Error: {error}</Text>
      </Box>
    );
  }

  // No results yet
  if (!result) {
    return (
      <Box padding={1}>
        <Text color={COLORS.textMuted}>Execute a query to see results</Text>
      </Box>
    );
  }

  // Success message with stats
  const successMessage = (
    <Box marginBottom={1}>
      <Text color={COLORS.success}>
        ✓ {result.rowCount} row{result.rowCount !== 1 ? "s" : ""} returned
      </Text>
      {executionTime !== undefined && (
        <Text color={COLORS.textMuted}> in {executionTime}ms</Text>
      )}
    </Box>
  );

  // Empty result
  if (result.rows.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        {successMessage}
        <Text color={COLORS.textMuted}>No rows returned</Text>
      </Box>
    );
  }

  // Display results
  if (!displayData) return null;
  const { columns, rows, widths } = displayData;

  return (
    <Box flexDirection="column" paddingX={1}>
      {successMessage}

      {/* Column headers */}
      <Box>
        {columns.map((col, idx) => (
          <Box key={col.name} width={widths[idx]! + 2}>
            <Text color={COLORS.primary} bold>
              {col.name.slice(0, widths[idx]).padEnd(widths[idx]!)}
            </Text>
            <Text color={COLORS.border}> │</Text>
          </Box>
        ))}
        {result.columns.length > 5 && (
          <Text color={COLORS.textMuted}> +{result.columns.length - 5} cols</Text>
        )}
      </Box>

      {/* Separator */}
      <Box>
        {columns.map((col, idx) => (
          <Box key={`sep-${col.name}`} width={widths[idx]! + 2}>
            <Text color={COLORS.border}>{"─".repeat(widths[idx]!)}─┼</Text>
          </Box>
        ))}
      </Box>

      {/* Data rows */}
      {rows.map((row, rowIdx) => (
        <Box key={rowIdx}>
          {row.slice(0, 5).map((cell, cellIdx) => {
            const cellValue = cell === null ? "NULL" : String(cell);
            const width = widths[cellIdx]!;
            const displayValue = cellValue.slice(0, width).padEnd(width);
            const isNull = cell === null;

            return (
              <Box key={cellIdx} width={width + 2}>
                <Text
                  color={isNull ? COLORS.textMuted : COLORS.text}
                  dimColor={isNull}
                >
                  {displayValue}
                </Text>
                <Text color={COLORS.border}> │</Text>
              </Box>
            );
          })}
        </Box>
      ))}

      {/* More rows indicator */}
      {result.rows.length > maxRows && (
        <Box marginTop={1}>
          <Text color={COLORS.textMuted} dimColor>
            ... and {result.rows.length - maxRows} more rows
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default QueryResults;
