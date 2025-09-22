import type { FC } from 'react';
import { Box, Text } from 'ink';

interface AsciiArtProps {
  name?: string;
}

export const AsciiArt: FC<AsciiArtProps> = () => {
  return (
    <Box paddingX={1} paddingY={1}>
      <Text color="yellow" bold>
        {`
  ▄▄▄       ██▓  
 ▒████▄    ▓██▒  
 ▒██  ▀█▄  ▒██▒  
 ░██▄▄▄▄██ ░██░  
  ▓█   ▓██▒░██░  
  ▒▒   ▓▒█░░▓    
   ▒   ▒▒ ░ ▒ ░  
   ░   ▒    ▒ ░  
       ░  ░ ░    
	   	       `}
      </Text>
    </Box>
  );
};
