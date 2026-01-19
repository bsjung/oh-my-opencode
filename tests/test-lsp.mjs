import { withLspClient } from './src/tools/lsp/utils.js';

async function test() {
  try {
    await withLspClient('src/tools/lsp/client.ts', async (client) => {
      const result = await client.diagnostics('src/tools/lsp/client.ts');
      console.log('Diagnostics:', JSON.stringify(result, null, 2));
    });
    console.log('LSP server started successfully!');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
