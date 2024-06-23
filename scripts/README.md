# Scripts

Scripting workspace for website scraping and data generation

1. Requirements:
	- `Node.js v20.10.0`
	- `npm`
2. Update `scripts/src/env.ts` with your `SESSION_COOKIE`
3. Runs scripts:

```bash
# From repository root
cd scripts

# Install dependencies
npm install

# Run scripts
npx tsx src/products-list.ts
npx tsx src/headphones-data.ts
npx tsx src/headphones-fr.ts
```
