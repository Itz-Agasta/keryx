import React from "react";
import { Box, Text } from "ink";
import { COLORS, TREE_ICONS } from "../../../shared/theme/colors.js";

export type NodeType = "database" | "schema" | "table";

export interface TreeNodeData {
  id: string;
  name: string;
  type: NodeType;
  children?: TreeNodeData[];
  isExpanded?: boolean;
  rowCount?: number;
  schema?: string;
}

interface TreeNodeProps {
  node: TreeNodeData;
  depth: number;
  isSelected: boolean;
  isFocused: boolean;
  isLast: boolean;
  parentPrefix: string;
  onSelect?: (node: TreeNodeData) => void;
  onToggle?: (node: TreeNodeData) => void;
}

/**
 * Get the icon for a node type
 */
function getNodeIcon(type: NodeType, isExpanded?: boolean): string {
  switch (type) {
    case "database":
      return TREE_ICONS.database;
    case "schema":
      return isExpanded ? TREE_ICONS.expanded : TREE_ICONS.collapsed;
    case "table":
      return TREE_ICONS.table;
    default:
      return "";
  }
}

/**
 * Format row count for display
 */
function formatRowCount(count?: number): string {
  if (count === undefined || count < 0) return "";
  if (count >= 1000000) return `(${(count / 1000000).toFixed(1)}M)`;
  if (count >= 1000) return `(${(count / 1000).toFixed(1)}K)`;
  return `(${count})`;
}

/**
 * Individual tree node component
 * Displays a single node in the database tree
 */
export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth,
  isSelected,
  isFocused,
  isLast,
  parentPrefix,
}) => {
  const icon = getNodeIcon(node.type, node.isExpanded);
  const rowCountStr = node.type === "table" ? formatRowCount(node.rowCount) : "";

  // Build prefix for this node
  const connector = isLast ? TREE_ICONS.lastBranch : TREE_ICONS.branch;
  const prefix = depth === 0 ? "" : `${parentPrefix}${connector}`;

  // Determine colors based on state
  const textColor = isSelected
    ? COLORS.primary
    : isFocused
      ? COLORS.text
      : COLORS.textMuted;

  const selectedMarker = isSelected ? TREE_ICONS.tableSelected : " ";

  return (
    <Box>
      {/* Prefix (tree lines) */}
      {depth > 0 && (
        <Text color={COLORS.border}>{prefix}</Text>
      )}

      {/* Selection indicator */}
      <Text color={COLORS.primary}>{selectedMarker}</Text>

      {/* Icon */}
      {icon && <Text>{icon} </Text>}

      {/* Node name */}
      <Text color={textColor} bold={isSelected}>
        {node.name}
      </Text>

      {/* Row count for tables */}
      {rowCountStr && (
        <Text color={COLORS.textMuted} dimColor> {rowCountStr}</Text>
      )}
    </Box>
  );
};

/**
 * Get the prefix for child nodes
 * This builds the vertical lines that connect nodes
 */
export function getChildPrefix(parentPrefix: string, isLast: boolean, depth: number): string {
  if (depth === 0) return "";
  const continuation = isLast ? TREE_ICONS.space : TREE_ICONS.line;
  return `${parentPrefix}${continuation} `;
}

export default TreeNode;
