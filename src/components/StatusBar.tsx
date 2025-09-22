import type { FC } from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  name: string;
}

export const StatusBar: FC<StatusBarProps> = (props) => {
  const { name } = props;
  return (
    <Box justifyContent="space-between" paddingX={1} paddingBottom={1}>
      <Text dimColor>~ no sandbox (see /docs)</Text>
      <Text dimColor>{name}-coder-plus (99% context left)</Text>
    </Box>
  );
};
