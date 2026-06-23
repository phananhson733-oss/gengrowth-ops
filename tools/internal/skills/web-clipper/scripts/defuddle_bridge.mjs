#!/usr/bin/env node
/**
 * Bridge script: reads HTML from stdin, runs defuddle, outputs JSON to stdout.
 * Usage: echo "<html>...</html>" | node defuddle_bridge.mjs [--url <original-url>]
 */
import { Defuddle } from 'defuddle/node';

const args = process.argv.slice(2);
let url = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    url = args[i + 1];
    i++;
  }
}

// Read HTML from stdin
let html = '';
for await (const chunk of process.stdin) {
  html += chunk;
}

if (!html.trim()) {
  console.error('No HTML input received on stdin');
  process.exit(1);
}

try {
  const result = await Defuddle(html, url || 'https://example.com', { markdown: true });

  const output = {
    title: result.title || '',
    author: result.author || '',
    description: result.description || '',
    domain: result.domain || '',
    site: result.site || '',
    published: result.published || '',
    image: result.image || '',
    wordCount: result.wordCount || 0,
    content: result.content || '',
  };

  process.stdout.write(JSON.stringify(output, null, 2));
} catch (err) {
  console.error('Defuddle error:', err.message);
  process.exit(1);
}
