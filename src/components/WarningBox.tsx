import type { FC } from 'react';
import { Box, Text } from 'ink';

interface WarningBoxProps {
  name: string;
  show: boolean;
}

export const WarningBox: FC<WarningBoxProps> = (props) => {
  const { name, show } = props;
  if (!show) return null;

  return (
    <Box
      borderStyle="round"
      borderColor="yellow"
      paddingX={1}
      paddingY={0}
      marginY={1}
    >
      <Text color="yellow">
        You are running {name} Code in your home directory. It is recommended to
        run in a project-specific directory.
      </Text>
    </Box>
  );
};
