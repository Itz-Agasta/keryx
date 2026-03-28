import React, { useCallback } from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { TableInfo } from "../types/index.js";

interface TableBrowserProps {
  tables: TableInfo[];
  onSelect: (tableName: string) => void;
  isLoading?: boolean;
}

export const TableBrowser: React.FC<TableBrowserProps> = ({ tables, onSelect, isLoading }) => {
  const handleSelect = useCallback(
    (item: { value: string }) => {
      onSelect(item.value);
    },
    [onSelect],
  );

  if (isLoading) {
    return (
      <Box padding={1}>
        <Text color="yellow">Loading tables...</Text>
      </Box>
    );
  }

  if (tables.length === 0) {
    return (
      <Box padding={1}>
        <Text color="gray">No tables found</Text>
      </Box>
    );
  }

  const items = tables.map((table) => ({
    label: `${table.schema}.${table.name}${table.rowCount !== undefined ? ` (${table.rowCount})` : ""}`,
    value: `${table.schema}.${table.name}`,
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color="gray">{tables.length} tables found</Text>
      </Box>
      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};
