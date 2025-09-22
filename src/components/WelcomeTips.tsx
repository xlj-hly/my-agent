import type { FC } from 'react';
import { Box, Text } from 'ink';

interface WelcomeTipsProps {
  name?: string;
}

export const WelcomeTips: FC<WelcomeTipsProps> = () => {
  return (
    <Box flexDirection="column" paddingX={1} marginBottom={1}>
      <Text color="white">Tips for getting started:</Text>
      <Text>1. Ask questions, edit files, or run commands.</Text>
      <Text>2. Be specific for the best results.</Text>
      <Text>
        3. Create <Text color="magenta">README.md</Text> files to customize your
        interactions with Code.
      </Text>
      <Text>
        4. <Text color="magenta">/help</Text> for more information.
      </Text>
    </Box>
  );
};
