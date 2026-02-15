import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type { ConnectRequest } from "../types/index.js";

interface ConnectionScreenProps {
  onConnect: (config: ConnectRequest) => void;
  error?: string;
  isConnecting: boolean;
}

interface FieldConfig {
  key: keyof ConnectRequest;
  label: string;
  value: string;
  mask?: string;
}

export const ConnectionScreen: React.FC<ConnectionScreenProps> = ({
  onConnect,
  error,
  isConnecting,
}) => {
  const [config, setConfig] = useState<ConnectRequest>({
    host: "localhost",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: "",
  });
  const [activeField, setActiveField] = useState<number>(0);

  const fields: FieldConfig[] = [
    { key: "host", label: "Host", value: config.host },
    { key: "port", label: "Port", value: String(config.port) },
    { key: "database", label: "Database", value: config.database },
    { key: "user", label: "User", value: config.user },
    { key: "password", label: "Password", value: config.password, mask: "*" },
  ];

  useInput((input, key) => {
    if (key.tab) {
      setActiveField((prev) => (prev + 1) % fields.length);
    }
    if (key.return) {
      onConnect(config);
    }
  });

  const handleChange = (key: keyof ConnectRequest, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: key === "port" ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Keryx - PostgreSQL Client
        </Text>
      </Box>

      <Box flexDirection="column" gap={1}>
        {fields.map((field, index) => (
          <Box key={field.key}>
            <Box width={12}>
              <Text color={activeField === index ? "green" : "gray"}>{field.label}:</Text>
            </Box>
            <Box>
              <TextInput
                value={field.value}
                onChange={(value: string) => handleChange(field.key, value)}
                mask={field.mask || ""}
                focus={activeField === index}
              />
            </Box>
          </Box>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text color="yellow">Press Enter to connect, Tab to switch fields</Text>
      </Box>

      {isConnecting && (
        <Box marginTop={1}>
          <Text color="blue">Connecting...</Text>
        </Box>
      )}

      {error && (
        <Box marginTop={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}
    </Box>
  );
};
