import React, { useState, useMemo } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";
import { Logo } from "./Logo.js";
import type { ConnectRequest } from "../types/index.js";

// Theme colors
const COLORS = {
  primary: "cyan",
  button: "#4052D6", // https://www.figma.com/colors/blue/
  text: "white",
  muted: "gray",
  success: "green",
  error: "red",
} as const;

interface LoginScreenProps {
  onConnect: (config: ConnectRequest) => void;
  error?: string;
  isConnecting: boolean;
}

interface FieldConfig {
  key: keyof ConnectRequest;
  label: string;
  placeholder: string;
  mask?: string;
}

// Form field definitions
const FIELDS: FieldConfig[] = [
  { key: "host", label: "Host", placeholder: "localhost" },
  { key: "port", label: "Port", placeholder: "5432" },
  { key: "database", label: "Database", placeholder: "postgres" },
  { key: "user", label: "Username", placeholder: "postgres" },
  { key: "password", label: "Password", placeholder: "", mask: "•" },
];

const LABEL_WIDTH = 12;

// Bordered container with optional title
const BorderedBox: React.FC<{
  title?: string;
  width: number;
  children: React.ReactNode;
}> = ({ title, width, children }) => {
  const innerWidth = width - 2;

  const topBorder = useMemo(() => {
    if (!title) return `┌${"─".repeat(innerWidth)}┐`;
    const titleText = ` ${title} `;
    const remaining = innerWidth - titleText.length - 1;
    return `┌─${titleText}${"─".repeat(Math.max(0, remaining))}┐`;
  }, [title, innerWidth]);

  return (
    <Box flexDirection="column">
      <Text color={COLORS.muted}>{topBorder}</Text>
      <Box flexDirection="column">
        {React.Children.map(children, (child) => (
          <Box>
            <Text color={COLORS.muted}>│</Text>
            <Box width={innerWidth}>{child}</Box>
            <Text color={COLORS.muted}>│</Text>
          </Box>
        ))}
      </Box>
      <Text color={COLORS.muted}>{`└${"─".repeat(innerWidth)}┘`}</Text>
    </Box>
  );
};

// Single form field with label and text input
const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  isFocused: boolean;
  mask?: string;
  placeholder?: string;
}> = ({ label, value, onChange, isFocused, mask, placeholder }) => (
  <Box paddingX={1}>
    <Box width={LABEL_WIDTH}>
      <Text color={isFocused ? COLORS.primary : COLORS.muted}>
        {isFocused ? "› " : "  "}
        {label}
      </Text>
    </Box>
    <Box flexGrow={1}>
      <TextInput
        value={value}
        onChange={onChange}
        focus={isFocused}
        mask={mask}
        placeholder={placeholder}
      />
    </Box>
  </Box>
);

// Submit button
const ConnectButton: React.FC<{
  isFocused: boolean;
  isConnecting: boolean;
}> = ({ isFocused, isConnecting }) => (
  <Box paddingX={1}>
    <Text color={isFocused ? COLORS.primary : COLORS.muted}>{isFocused ? "› " : "  "}</Text>
    <Text color="white" backgroundColor={COLORS.button} bold>
      {` ${isConnecting ? "Connecting..." : "Connect"} `}
    </Text>
  </Box>
);

// Keyboard shortcut hints
const KeyboardHints: React.FC = () => (
  <Box flexDirection="column" alignItems="center">
    <Text color={COLORS.muted} dimColor>
      <Text color={COLORS.text}>↑↓</Text> Navigate
      <Text color={COLORS.muted}> • </Text>
      <Text color={COLORS.text}>Tab</Text> Next
      <Text color={COLORS.muted}> • </Text>
      <Text color={COLORS.text}>Enter</Text> Connect
      <Text color={COLORS.muted}> • </Text>
      <Text color={COLORS.text}>Ctrl+C</Text> Exit
    </Text>
  </Box>
);

export const LoginScreen: React.FC<LoginScreenProps> = ({ onConnect, error, isConnecting }) => {
  const { stdout } = useStdout();
  const termWidth = stdout?.columns ?? 80;
  const termHeight = stdout?.rows ?? 24;

  const [config, setConfig] = useState<ConnectRequest>({
    host: "localhost",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: "",
  });

  const [focusIndex, setFocusIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalItems = FIELDS.length + 1; // fields + button
  const boxWidth = Math.min(60, termWidth - 4);

  // Move focus with wraparound
  const moveFocus = (delta: number) => {
    setFocusIndex((i) => (i + delta + totalItems) % totalItems);
    setValidationError(null);
  };

  // Update a field value
  const updateField = (key: keyof ConnectRequest, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: key === "port" ? parseInt(value, 10) || 0 : value,
    }));
    setValidationError(null);
  };

  // Validate and submit
  const handleSubmit = () => {
    const validations: [boolean, string, number][] = [
      [!config.host.trim(), "Host is required", 0],
      [!config.port || config.port <= 0, "Valid port is required", 1],
      [!config.database.trim(), "Database is required", 2],
      [!config.user.trim(), "Username is required", 3],
    ];

    for (const [failed, message, fieldIndex] of validations) {
      if (failed) {
        setValidationError(message);
        setFocusIndex(fieldIndex);
        return;
      }
    }

    setValidationError(null);
    onConnect(config);
  };

  // Handle keyboard navigation
  useInput((_, key) => {
    if (key.tab && !key.shift) moveFocus(1);
    if (key.tab && key.shift) moveFocus(-1);
    if (key.upArrow) moveFocus(-1);
    if (key.downArrow) moveFocus(1);
    if (key.return) handleSubmit();
  });

  // Vertical centering
  const contentHeight = 18;
  const paddingTop = Math.max(0, Math.floor((termHeight - contentHeight) / 3));

  const displayError = validationError || error;

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      width="100%"
      height="100%"
      paddingTop={paddingTop}
    >
      {/* Logo */}
      <Box marginBottom={1}>
        <Logo text="KERYX" palette="dawn" />
      </Box>

      {/* Connection form */}
      <Box flexDirection="column" alignItems="center" marginY={1}>
        <BorderedBox title="Connect to PostgreSQL" width={boxWidth}>
          <Box height={1} />

          {FIELDS.map((field, i) => (
            <InputField
              key={field.key}
              label={field.label}
              value={String(config[field.key])}
              onChange={(v) => updateField(field.key, v)}
              isFocused={focusIndex === i}
              mask={field.mask}
              placeholder={field.placeholder}
            />
          ))}

          <Box height={1} />
          <ConnectButton isFocused={focusIndex === FIELDS.length} isConnecting={isConnecting} />
          <Box height={1} />
        </BorderedBox>
      </Box>

      {/* Error display */}
      {displayError && (
        <Box marginY={1}>
          <Text color={COLORS.error}>{displayError}</Text>
        </Box>
      )}

      {/* Connecting status */}
      {isConnecting && (
        <Box marginY={1}>
          <Text color={COLORS.primary}>
            Connecting to {config.host}:{config.port}...
          </Text>
        </Box>
      )}

      {/* Keyboard hints */}
      <Box marginTop={1}>
        <KeyboardHints />
      </Box>
    </Box>
  );
};

export default LoginScreen;
