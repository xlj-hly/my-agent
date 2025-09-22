import { render } from 'ink';
import meow from 'meow';
import { App } from './app.js';

const cli = meow(
  `
		Usage
		  $ my-ai-cli

		Options
			--name  AI助手的名称 (默认: 阿冬)

		Examples
		  $ my-ai-cli
		  $ my-ai-cli --name=阿冬
    `,
  {
    importMeta: import.meta,
    flags: {
      name: {
        type: 'string',
        default: '阿冬',
      },
    },
  }
);

render(<App name={cli.flags.name} />);
