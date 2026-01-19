import { withLspClient } from './src/tools/lsp/utils.js';

async function test() {
  console.log('Starting LSP server...');
  console.log('Current PID:', process.pid);

  try {
    await withLspClient('src/tools/lsp/client.ts', async (client) => {
      console.log('LSP server connected!');

      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('Getting diagnostics...');
      const result = await client.diagnostics('src/tools/lsp/client.ts');
      console.log('Diagnostics result:', JSON.stringify(result, null, 2));

      // Wait another 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('Done!');
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
