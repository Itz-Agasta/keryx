import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { TableInfo } from "../types/index.js";

interface TableBrowserProps {
  tables: TableInfo[];
  onSelect: (tableName: string) => void;
}

export const TableBrowser: React.FC<TableBrowserProps> = ({ tables, onSelect }) => {
  const items = tables.map((table) => ({
    label: `${table.schema}.${table.name}${table.rowCount !== undefined ? ` (${table.rowCount})` : ""}`,
    value: `${table.schema}.${table.name}`,
  }));

  const handleSelect = (item: { value: string }) => {
    onSelect(item.value);
  };

  if (tables.length === 0) {
    return (
      <Box padding={1}>
        <Text color="gray">No tables found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};
