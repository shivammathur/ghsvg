#!/usr/bin/env node

(async () => {
  (await import('../lib/index.js')).run(process.argv.slice(2));
})();
