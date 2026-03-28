import React, { useState, useEffect, useMemo } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";
import Gradient from "ink-gradient";
import cfonts from "cfonts";
import type { ConnectRequest } from "../types/index.js";

// ============================================================================
// Color Palette
// ============================================================================
const COLORS = {
  primary: "cyan",      // #0EA5E9 - logo, active elements
  text: "white",        // #E2E8F0 - main text
  muted: "gray",        // #64748B - labels and hints
  border: "gray",       // #334155 - box borders
  success: "green",     // #10B981 - success states
  error: "red",         // #EF4444 - validation errors
} as const;

// Gradient colors for the logo (blue gradient like grad-blue palette)
const LOGO_GRADIENT_COLORS = ["#4ea8ff", "#0EA5E9", "#0072ff"];

// ============================================================================
// Types
// ============================================================================
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

// ============================================================================
// GradientLogo Component - Block-style ASCII art with gradient
// ============================================================================
interface GradientLogoProps {
  text: string;
  font?: "block" | "simple" | "simpleBlock" | "3d" | "chrome" | "huge" | "shade" | "slick" | "tiny" | "grid" | "pallet" | "simple3d";
  colors?: string[];
  letterSpacing?: number;
}

// Helper to strip ANSI codes from strings
const stripAnsi = (str: string): string => {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
};

const GradientLogo: React.FC<GradientLogoProps> = ({
  text,
  font = "block",
  colors = LOGO_GRADIENT_COLORS,
  letterSpacing = 1,
}) => {
  const logoLines = useMemo(() => {
    try {
      // Use cfonts to render the block text
      const rendered = cfonts.render(text, {
        font: font,
        colors: ["white"], // We'll apply gradient ourselves
        background: "transparent",
        letterSpacing: letterSpacing,
        lineHeight: 0,
        space: false,
        maxLength: 0,
        gradient: false,
        independentGradient: false,
        transitionGradient: false,
        rawMode: true, // Get raw output without ANSI codes
        env: "node",
      });

      // Handle case where render returns false
      if (!rendered || typeof rendered === "boolean") {
        return [text];
      }

      // Strip ANSI codes and split into lines, filter empty ones
      return stripAnsi(rendered.string)
        .split("\n")
        .filter((line: string) => line.trim().length > 0);
    } catch (err) {
      console.error("Logo render error:", err);
      return [text];
    }
  }, [text, font, letterSpacing]);

  return (
    <Box flexDirection="column" alignItems="center">
      <Gradient colors={colors}>
        <Box flexDirection="column">
          {logoLines.map((line: string, index: number) => (
            <Text key={index}>{line}</Text>
          ))}
        </Box>
      </Gradient>
    </Box>
  );
};

// ============================================================================
// BorderedBox Component - Renders a box with Unicode borders and title
// ============================================================================
interface BorderedBoxProps {
  title?: string;
  width: number;
  children: React.ReactNode;
}

const BorderedBox: React.FC<BorderedBoxProps> = ({ title, width, children }) => {
  const innerWidth = width - 2; // Account for left and right borders

  // Build the top border with optional title
  const topBorder = useMemo(() => {
    if (title) {
      const titleWithPadding = ` ${title} `;
      const remainingWidth = innerWidth - titleWithPadding.length - 1;
      return `┌─${titleWithPadding}${"─".repeat(Math.max(0, remainingWidth))}┐`;
    }
    return `┌${"─".repeat(innerWidth)}┐`;
  }, [title, innerWidth]);

  const bottomBorder = `└${"─".repeat(innerWidth)}┘`;

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
      <Text color={COLORS.muted}>{bottomBorder}</Text>
    </Box>
  );
};

// ============================================================================
// InputField Component - Single form field with label and input
// ============================================================================
interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isFocused: boolean;
  labelWidth: number;
  mask?: string;
  placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  isFocused,
  labelWidth,
  mask,
  placeholder,
}) => {
  return (
    <Box paddingX={1}>
      <Box width={labelWidth}>
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
};

// ============================================================================
// ConnectButton Component
// ============================================================================
interface ConnectButtonProps {
  isFocused: boolean;
  isConnecting: boolean;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({
  isFocused,
  isConnecting,
}) => {
  const buttonText = isConnecting ? "Connecting..." : "Connect";

  return (
    <Box paddingX={1} paddingY={0}>
      <Text color={isFocused ? COLORS.primary : COLORS.muted}>
        {isFocused ? "› " : "  "}
      </Text>
      <Text
        color={isFocused ? "black" : COLORS.muted}
        backgroundColor={isFocused ? COLORS.primary : undefined}
      >
        {` ${buttonText} `}
      </Text>
    </Box>
  );
};

// ============================================================================
// KeyboardHints Component
// ============================================================================
const KeyboardHints: React.FC = () => {
  return (
    <Box flexDirection="column" alignItems="center">
      <Box>
        <Text color={COLORS.muted} dimColor>
          <Text color={COLORS.text}>↑↓</Text> Navigate
          <Text color={COLORS.muted}> • </Text>
          <Text color={COLORS.text}>Tab</Text> Next field
          <Text color={COLORS.muted}> • </Text>
          <Text color={COLORS.text}>Enter</Text> Connect
        </Text>
      </Box>
      <Box>
        <Text color={COLORS.muted} dimColor>
          <Text color={COLORS.text}>Ctrl+C</Text> Exit
        </Text>
      </Box>
    </Box>
  );
};

// ============================================================================
// Main LoginScreen Component
// ============================================================================
export const LoginScreen: React.FC<LoginScreenProps> = ({
  onConnect,
  error,
  isConnecting,
}) => {
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;
  const terminalHeight = stdout?.rows || 24;

  // Form state
  const [config, setConfig] = useState<ConnectRequest>({
    host: "localhost",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: "",
  });

  // Focus state: 0-4 for fields, 5 for Connect button
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Field configuration
  const fields: FieldConfig[] = [
    { key: "host", label: "Host", placeholder: "localhost" },
    { key: "port", label: "Port", placeholder: "5432" },
    { key: "database", label: "Database", placeholder: "postgres" },
    { key: "user", label: "Username", placeholder: "postgres" },
    { key: "password", label: "Password", placeholder: "", mask: "•" },
  ];

  const totalFocusableItems = fields.length + 1; // fields + Connect button
  const labelWidth = 12;
  const boxWidth = Math.min(60, terminalWidth - 4);

  // Handle keyboard input
  useInput((input, key) => {
    // Navigation
    if (key.tab && !key.shift) {
      setFocusedIndex((prev) => (prev + 1) % totalFocusableItems);
      setValidationError(null);
    }
    if (key.tab && key.shift) {
      setFocusedIndex((prev) => (prev - 1 + totalFocusableItems) % totalFocusableItems);
      setValidationError(null);
    }
    if (key.upArrow) {
      setFocusedIndex((prev) => (prev - 1 + totalFocusableItems) % totalFocusableItems);
      setValidationError(null);
    }
    if (key.downArrow) {
      setFocusedIndex((prev) => (prev + 1) % totalFocusableItems);
      setValidationError(null);
    }

    // Submit on Enter
    if (key.return) {
      handleConnect();
    }
  });

  // Update field value
  const handleFieldChange = (key: keyof ConnectRequest, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: key === "port" ? (parseInt(value, 10) || 0) : value,
    }));
    setValidationError(null);
  };

  // Validate and connect
  const handleConnect = () => {
    // Basic validation
    if (!config.host.trim()) {
      setValidationError("Host is required");
      setFocusedIndex(0);
      return;
    }
    if (!config.port || config.port <= 0) {
      setValidationError("Valid port is required");
      setFocusedIndex(1);
      return;
    }
    if (!config.database.trim()) {
      setValidationError("Database is required");
      setFocusedIndex(2);
      return;
    }
    if (!config.user.trim()) {
      setValidationError("Username is required");
      setFocusedIndex(3);
      return;
    }

    setValidationError(null);
    onConnect(config);
  };

  // Calculate vertical padding to center the content
  const contentHeight = 20; // Approximate height: logo (~8) + form (~10) + hints (~2)
  const verticalPadding = Math.max(0, Math.floor((terminalHeight - contentHeight) / 3));

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width="100%"
      height="100%"
      paddingTop={verticalPadding}
    >
      {/* Logo Section - Block style with gradient */}
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <GradientLogo
          text="KERYX"
          font="block"
          colors={LOGO_GRADIENT_COLORS}
          letterSpacing={1}
        />
        <Box marginTop={0}>
          <Text color={COLORS.muted} dimColor>
            PostgreSQL Terminal Client
          </Text>
        </Box>
      </Box>

      {/* Connection Form */}
      <Box flexDirection="column" alignItems="center" marginY={1}>
        <BorderedBox title="Connect to PostgreSQL" width={boxWidth}>
          {/* Empty line for spacing */}
          <Box height={1} />

          {/* Form Fields */}
          {fields.map((field, index) => (
            <InputField
              key={field.key}
              label={field.label}
              value={field.key === "port" ? String(config[field.key]) : String(config[field.key])}
              onChange={(value) => handleFieldChange(field.key, value)}
              isFocused={focusedIndex === index}
              labelWidth={labelWidth}
              mask={field.mask}
              placeholder={field.placeholder}
            />
          ))}

          {/* Empty line for spacing */}
          <Box height={1} />

          {/* Connect Button */}
          <ConnectButton
            isFocused={focusedIndex === fields.length}
            isConnecting={isConnecting}
          />

          {/* Empty line for spacing */}
          <Box height={1} />
        </BorderedBox>
      </Box>

      {/* Error Messages */}
      {(error || validationError) && (
        <Box marginY={1}>
          <Text color={COLORS.error}>
            {validationError || error}
          </Text>
        </Box>
      )}

      {/* Connecting Status */}
      {isConnecting && (
        <Box marginY={1}>
          <Text color={COLORS.primary}>
            Connecting to {config.host}:{config.port}...
          </Text>
        </Box>
      )}

      {/* Keyboard Hints */}
      <Box marginTop={1}>
        <KeyboardHints />
      </Box>
    </Box>
  );
};

export default LoginScreen;
