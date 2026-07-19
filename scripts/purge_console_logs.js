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
    
    // Simplistic regex for single line console.logs
    // Matches console.log(...) maybe followed by semicolon
    const regex = /^[ \t]*console\.log\([^\n]+\);?[\r\n]+/gm;
    content = content.replace(regex, '');
    
    // If it's inline in a block: ` { console.log(x) }`
    content = content.replace(/console\.log\([^)]+\);?/g, '');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Purged in', file);
    }
});

console.log(`Purged console.logs in ${changedCount} files.`);
