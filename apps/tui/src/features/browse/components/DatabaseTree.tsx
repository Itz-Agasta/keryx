import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { TreeNode, getChildPrefix, type TreeNodeData } from "./TreeNode.js";
import { COLORS, TREE_ICONS } from "../../../shared/theme/colors.js";
import type { TableInfo } from "../../../types/index.js";

interface DatabaseTreeProps {
  tables: TableInfo[];
  selectedTable: TableInfo | null;
  onSelectTable: (table: TableInfo) => void;
  isFocused: boolean;
  isLoading?: boolean;
  focusedIndex: number;
  onFocusedIndexChange: (index: number) => void;
  onToggleExpand: (nodeId: string) => void;
  expandedNodes: Set<string>;
  databaseName?: string;
  /** Callback when Enter is pressed on a node */
  onEnter?: () => void;
  /** Callback when Right arrow is pressed (expand) */
  onExpand?: () => void;
  /** Callback when Left arrow is pressed (collapse) */
  onCollapse?: () => void;
}

/**
 * Build tree structure from flat table list
 */
function buildTreeFromTables(
  tables: TableInfo[],
  databaseName: string,
  expandedNodes: Set<string>
): TreeNodeData {
  // Group tables by schema
  const schemaMap = new Map<string, TableInfo[]>();
  for (const table of tables) {
    const schemaKey = table.schema || "public";
    if (!schemaMap.has(schemaKey)) {
      schemaMap.set(schemaKey, []);
    }
    schemaMap.get(schemaKey)!.push(table);
  }

  // Build schema nodes
  const schemaNodes: TreeNodeData[] = Array.from(schemaMap.entries()).map(
    ([schemaName, schemaTables]) => ({
      id: `schema:${schemaName}`,
      name: schemaName,
      type: "schema" as const,
      isExpanded: expandedNodes.has(`schema:${schemaName}`),
      children: schemaTables.map((table) => ({
        id: `table:${table.schema}.${table.name}`,
        name: table.name,
        type: "table" as const,
        rowCount: table.rowCount,
        schema: table.schema,
      })),
    })
  );

  return {
    id: "database",
    name: databaseName,
    type: "database",
    isExpanded: expandedNodes.has("database"),
    children: schemaNodes,
  };
}

/**
 * Flatten tree into array of visible nodes for keyboard navigation
 */
interface FlatNode {
  node: TreeNodeData;
  depth: number;
  isLast: boolean;
  parentPrefix: string;
  table?: TableInfo;
}

function flattenTree(
  node: TreeNodeData,
  depth: number = 0,
  isLast: boolean = true,
  parentPrefix: string = "",
  tables: TableInfo[] = []
): FlatNode[] {
  const result: FlatNode[] = [];

  // Find matching table if this is a table node
  const table = node.type === "table"
    ? tables.find((t) => `table:${t.schema}.${t.name}` === node.id)
    : undefined;

  result.push({ node, depth, isLast, parentPrefix, table });

  if (node.children && node.isExpanded) {
    const childPrefix = getChildPrefix(parentPrefix, isLast, depth);
    node.children.forEach((child, index) => {
      const isChildLast = index === node.children!.length - 1;
      result.push(...flattenTree(child, depth + 1, isChildLast, childPrefix, tables));
    });
  }

  return result;
}

/**
 * Database tree component with keyboard navigation
 * Shows hierarchical view: Database > Schema > Tables
 */
export const DatabaseTree: React.FC<DatabaseTreeProps> = ({
  tables,
  selectedTable,
  onSelectTable,
  isFocused,
  isLoading = false,
  focusedIndex,
  onFocusedIndexChange,
  onToggleExpand,
  expandedNodes,
  databaseName = "database",
}) => {
  // Build and flatten tree
  const flatNodes = useMemo(() => {
    const tree = buildTreeFromTables(tables, databaseName, expandedNodes);
    return flattenTree(tree, 0, true, "", tables);
  }, [tables, databaseName, expandedNodes]);

  // Clamp focused index to valid range
  const clampedIndex = Math.min(focusedIndex, Math.max(0, flatNodes.length - 1));
  
  // Get currently focused node
  const focusedNode = flatNodes[clampedIndex];

  // Handle Enter key - select table or toggle expand
  const handleEnter = useCallback(() => {
    if (!focusedNode) return;
    
    if (focusedNode.table) {
      onSelectTable(focusedNode.table);
    } else if (focusedNode.node.type === "database" || focusedNode.node.type === "schema") {
      onToggleExpand(focusedNode.node.id);
    }
  }, [focusedNode, onSelectTable, onToggleExpand]);

  // Handle Right arrow - expand node
  const handleExpand = useCallback(() => {
    if (!focusedNode) return;
    const node = focusedNode.node;
    
    if ((node.type === "database" || node.type === "schema") && !node.isExpanded) {
      onToggleExpand(node.id);
    }
  }, [focusedNode, onToggleExpand]);

  // Handle Left arrow - collapse node
  const handleCollapse = useCallback(() => {
    if (!focusedNode) return;
    const node = focusedNode.node;
    
    if ((node.type === "database" || node.type === "schema") && node.isExpanded) {
      onToggleExpand(node.id);
    }
  }, [focusedNode, onToggleExpand]);

  // Expose handlers via useInput when focused
  useInput(
    (input, key) => {
      if (!isFocused) return;

      if (key.return) {
        handleEnter();
        return;
      }
      if (key.rightArrow) {
        handleExpand();
        return;
      }
      if (key.leftArrow) {
        handleCollapse();
        return;
      }
    },
    { isActive: isFocused }
  );

  // Loading state
  if (isLoading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={COLORS.primary}>Loading tables...</Text>
      </Box>
    );
  }

  // Empty state
  if (tables.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={COLORS.textMuted}>No tables found</Text>
        <Text color={COLORS.textMuted} dimColor>
          Press R to refresh
        </Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      paddingX={1}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={COLORS.primary} bold>
          Tables
        </Text>
        <Text color={COLORS.textMuted}> ({tables.length})</Text>
      </Box>

      {/* Tree nodes */}
      <Box flexDirection="column">
        {flatNodes.map((flatNode, index) => {
          const isSelected =
            flatNode.table &&
            selectedTable &&
            flatNode.table.schema === selectedTable.schema &&
            flatNode.table.name === selectedTable.name;

          return (
            <TreeNode
              key={flatNode.node.id}
              node={flatNode.node}
              depth={flatNode.depth}
              isSelected={isSelected ?? false}
              isFocused={isFocused && index === clampedIndex}
              isLast={flatNode.isLast}
              parentPrefix={flatNode.parentPrefix}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default DatabaseTree;
