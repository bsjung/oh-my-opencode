import { withLspClient } from './src/tools/lsp/utils.js';

async function keepAlive() {
  try {
    await withLspClient('src/tools/lsp/client.ts', async (client) => {
      console.log('LSP server started. Keeping alive...');
      console.log('Process PID:', process.pid);
      console.log('Press Ctrl+C to exit');

      // Keep alive for 30 seconds
      await new Promise(resolve => setTimeout(resolve, 30000));

      const result = await client.diagnostics('src/tools/lsp/client.ts');
      console.log('Diagnostics:', result);
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

keepAlive();
