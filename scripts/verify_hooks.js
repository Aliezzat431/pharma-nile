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

let warnings = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Find all useEffects
    const useEffectRegex = /useEffect\(\s*\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[.*?\]\)/g;
    let match;
    while ((match = useEffectRegex.exec(content)) !== null) {
        const effectBody = match[1];
        
        const hasAddListener = effectBody.includes('addEventListener') || effectBody.includes('.subscribe') || effectBody.includes('setInterval');
        const hasRemoveListener = effectBody.includes('removeEventListener') || effectBody.includes('.unsubscribe') || effectBody.includes('clearInterval') || effectBody.includes('removeChannel');
        
        // This is a naive heuristic but detects obvious bugs
        if (hasAddListener && !hasRemoveListener) {
            console.log(`\nPotential memory leak in ${file}:`);
            console.log(`Found event listener/subscription WITHOUT cleanup in useEffect.`);
            warnings++;
        }
    }
});

console.log(`\nFound ${warnings} potential memory leaks.`);
