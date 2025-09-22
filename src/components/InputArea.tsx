import type { FC } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const InputArea: FC<InputAreaProps> = (props) => {
  const { value, onChange, onSubmit } = props;
  return (
    <Box
      borderStyle="round"
      borderColor="gray"
      paddingX={1}
      paddingY={0}
      marginX={1}
      marginBottom={1}
    >
      <Text color="cyan">{`>`} </Text>
      <TextInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder="  Type your message or @path/to/file"
      />
    </Box>
  );
};
