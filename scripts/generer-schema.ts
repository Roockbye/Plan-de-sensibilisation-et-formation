/**
 * `npm run schema` : produit config/organisation.schema.json à partir du schéma Zod,
 * pour l'autocomplétion et la validation en direct dans les éditeurs (VS Code…).
 */
import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { configSchema } from '../src/lib/config.ts';

const schema = z.toJSONSchema(configSchema, { io: 'input', unrepresentable: 'any' });
writeFileSync('config/organisation.schema.json', JSON.stringify({ title: "Configuration de l'organisation", ...schema }, null, 2) + '\n');
console.log('✔ config/organisation.schema.json généré');
