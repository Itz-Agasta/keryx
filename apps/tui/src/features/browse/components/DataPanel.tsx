import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { useScreenSize } from "fullscreen-ink";
import { COLORS } from "../../../shared/theme/colors.js";
import type { QueryResult, TableInfo } from "../../../types/index.js";

interface DataPanelProps {
  selectedTable: TableInfo | null;
  data: QueryResult | null;
  isLoading: boolean;
  error: string | null;
  isFocused: boolean;
  scrollY: number;
  scrollX: number;
  onScrollY: (offset: number) => void;
  onScrollX: (offset: number) => void;
}

/**
 * Calculate column widths based on content and distribute to fill available space
 */
function calculateColumnWidths(
  columns: { name: string }[],
  rows: unknown[][],
  availableWidth: number,
  visibleColumns: number
): number[] {
  if (columns.length === 0) return [];

  const columnsToShow = columns.slice(0, visibleColumns);
  
  // First pass: calculate natural widths based on content
  const naturalWidths = columnsToShow.map((col, idx) => {
    let maxColWidth = col.name.length;

    // Check data rows (sample first 50)
    for (const row of rows.slice(0, 50)) {
      const cellValue = String(row[idx] ?? "NULL");
      maxColWidth = Math.max(maxColWidth, cellValue.length);
    }

    // Clamp natural width between 5 and 30
    return Math.min(Math.max(maxColWidth, 5), 30);
  });

  // Calculate total natural width (each column has 3 extra chars for " │ ")
  const separatorChars = 3;
  const totalNatural = naturalWidths.reduce((sum, w) => sum + w + separatorChars, 0);
  
  // Available width minus borders and padding (~6 chars)
  const usableWidth = availableWidth - 6;
  
  // If we have extra space, distribute proportionally
  if (totalNatural < usableWidth && columnsToShow.length > 0) {
    const extraSpace = usableWidth - totalNatural;
    const extraPerColumn = Math.floor(extraSpace / columnsToShow.length);
    const remainder = extraSpace % columnsToShow.length;
    
    return naturalWidths.map((w, idx) => {
      // Give extra space, with remainder going to last column
      const extra = extraPerColumn + (idx === columnsToShow.length - 1 ? remainder : 0);
      return Math.min(w + extra, 60); // Cap at 60
    });
  }

  return naturalWidths;
}

/**
 * Data panel component showing table data in a grid
 */
export const DataPanel: React.FC<DataPanelProps> = ({
  selectedTable,
  data,
  isLoading,
  error,
  isFocused,
  scrollY,
  scrollX,
}) => {
  const { height, width: screenWidth } = useScreenSize();

  // Calculate the data panel width (screen minus tree panel ~30%)
  const treeWidth = Math.max(20, Math.min(40, Math.floor(screenWidth * 0.3)));
  const panelWidth = screenWidth - treeWidth;

  // Calculate visible area
  const visibleRows = Math.max(5, height - 10);
  const maxVisibleColumns = 8; // Allow more columns

  // Get visible data slice
  const visibleData = useMemo(() => {
    if (!data || data.rows.length === 0) return null;

    const columns = data.columns.slice(scrollX, scrollX + maxVisibleColumns);
    const rows = data.rows.slice(scrollY, scrollY + visibleRows);
    const columnWidths = calculateColumnWidths(
      columns,
      data.rows,
      panelWidth,
      maxVisibleColumns
    );

    return { columns, rows, columnWidths };
  }, [data, scrollX, scrollY, visibleRows, panelWidth, maxVisibleColumns]);

  // Empty state - no table selected
  if (!selectedTable && !data) {
    return (
      <Box
        flexDirection="column"
        paddingX={1}
        paddingY={1}
        flexGrow={1}
      >
        <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
          <Text color={COLORS.primary}>Table Data</Text>
          <Box marginTop={1}>
            <Text color={COLORS.textMuted}>Select a table from the tree to view data</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={COLORS.textMuted} dimColor>
              ↑↓ Navigate • Enter Select • Tab Switch panel
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Box
        flexDirection="column"
        paddingX={1}
        flexGrow={1}
      >
        <Box marginBottom={1}>
          <Text color={COLORS.primary}>
            {selectedTable?.schema}.{selectedTable?.name}
          </Text>
        </Box>
        <Text color={COLORS.warning}>Loading data...</Text>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        flexDirection="column"
        paddingX={1}
        flexGrow={1}
      >
        <Box marginBottom={1}>
          <Text color={COLORS.primary}>
            {selectedTable?.schema}.{selectedTable?.name}
          </Text>
        </Box>
        <Text color={COLORS.error}>{error}</Text>
      </Box>
    );
  }

  // No data
  if (!data || !visibleData) {
    return (
      <Box
        flexDirection="column"
        paddingX={1}
        flexGrow={1}
      >
        <Text color={COLORS.textMuted}>No data available</Text>
      </Box>
    );
  }

  const { columns, rows, columnWidths } = visibleData;

  // Check if we can scroll (more data than visible)
  const canScrollDown = scrollY + visibleRows < data.rows.length;
  const canScrollUp = scrollY > 0;
  const canScroll = data.rows.length > visibleRows;

  return (
    <Box
      flexDirection="column"
      paddingX={1}
      flexGrow={1}
    >
      {/* Table header info */}
      <Box marginBottom={1}>
        <Text color={COLORS.primary} bold>
          {selectedTable?.schema}.{selectedTable?.name}
        </Text>
        <Text color={COLORS.textMuted}>
          {" "}({data.rowCount.toLocaleString()} rows)
        </Text>
        {canScroll && (
          <Text color={COLORS.textMuted} dimColor>
            {" "}• [{scrollY + 1}-{Math.min(scrollY + visibleRows, data.rows.length)}/{data.rows.length}]
          </Text>
        )}
      </Box>

      {/* Column headers */}
      <Box>
        {scrollX > 0 && <Text color={COLORS.textMuted}>‹ </Text>}
        {columns.map((col, idx) => (
          <Box key={col.name} width={columnWidths[idx]! + 2}>
            <Text color={COLORS.primary} bold>
              {col.name.slice(0, columnWidths[idx]).padEnd(columnWidths[idx]!)}
            </Text>
            <Text color={COLORS.border}> │</Text>
          </Box>
        ))}
        {scrollX + maxVisibleColumns < data.columns.length && (
          <Text color={COLORS.textMuted}> ›</Text>
        )}
      </Box>

      {/* Header separator */}
      <Box>
        {columns.map((col, idx) => (
          <Box key={`sep-${col.name}`} width={columnWidths[idx]! + 2}>
            <Text color={COLORS.border}>
              {"─".repeat(columnWidths[idx]!)}─┼
            </Text>
          </Box>
        ))}
      </Box>

      {/* Data rows */}
      {rows.map((row, rowIdx) => (
        <Box key={rowIdx}>
          {row.slice(scrollX, scrollX + maxVisibleColumns).map((cell, cellIdx) => {
            const cellValue = cell === null ? "NULL" : String(cell);
            const colWidth = columnWidths[cellIdx]!;
            const displayValue = cellValue.slice(0, colWidth).padEnd(colWidth);
            const isNull = cell === null;

            return (
              <Box key={cellIdx} width={colWidth + 2}>
                <Text
                  color={isNull ? COLORS.textMuted : (rowIdx % 2 === 0 ? COLORS.text : COLORS.textMuted)}
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

      {/* Scroll indicators - only show if there's more data to scroll */}
      {canScroll && (
        <Box marginTop={1}>
          <Text color={COLORS.textMuted} dimColor>
            ↑↓ scroll{canScrollUp && " ▲"}{canScrollDown && " ▼"}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default DataPanel;
