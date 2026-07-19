import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const searchDir = path.join(__dirname, '..', 'src');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath));
        } else {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walkDir(searchDir);

let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    const replacements = {
        'bg-white/5': 'bg-[var(--glass-surface)]',
        'bg-white/10': 'bg-[var(--glass-surface-heavy)]',
        'border-white/10': 'border-[var(--glass-border)]',
        'border-white/5': 'border-[var(--glass-border)]',
        'text-gray-400': 'text-[var(--text-muted)]',
        'text-gray-500': 'text-[var(--text-inactive)]',
        'hover:bg-white/5': 'hover:bg-[var(--glass-surface-heavy)]',
        'text-white': 'text-[var(--text-primary)]',
        'bg-black/20': 'bg-[var(--surface-overlay)]',
    };

    // Need to use regex to make sure we replace whole words
    // but the class names have slashes and dashes, so standard word boundary \b doesn't quite work.
    // We can just simple replace string, but this might replace middle of strings...
    // Let's just do global replace. We can't regex replace on string boundaries easily for css class names.
    // Instead we can split by space, map, and join. Or use regex `(?<=\\s|['"\`])text-white(?=\\s|['"\`])`

    for (const [key, value] of Object.entries(replacements)) {
        // match key surrounded by space, quote, backtick
        const regex = new RegExp(`(?<=\\\\s|['"\`])${key.replace(/[/]/g, '\\/')}(?=\\\\s|['"\`])`, 'g');
        content = content.replace(regex, value);
    }
    
    // Fallback simple replace for some classes if above regex fails. Let's just use split replace.
    // Actually the regex above is safe but maybe too safe. Let's just do an exact match replace for the very specific ones
    content = content.replaceAll(/bg-white\/5/g, 'bg-[var(--glass-surface)]');
    content = content.replaceAll(/bg-white\/10/g, 'bg-[var(--glass-surface-heavy)]');
    content = content.replaceAll(/border-white\/10/g, 'border-[var(--glass-border)]');
    content = content.replaceAll(/border-white\/5/g, 'border-[var(--glass-border)]');
    content = content.replaceAll(/hover:bg-white\/5/g, 'hover:bg-[var(--glass-surface-heavy)]');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Updated', file);
    }
});

console.log(`Replaced hardcoded utility classes in ${changedCount} files.`);
