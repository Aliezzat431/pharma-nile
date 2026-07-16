const fs = require('fs');

const path = './src/app/globals.css';
let css = fs.readFileSync(path, 'utf8');

// Fix Light Theme glass-rgb
css = css.replace(
  /\[data-theme="light"\]\s*\{([\s\S]*?)--glass-rgb:\s*255,\s*255,\s*255;([\s\S]*?)\}/,
  (match, p1, p2) => {
    return `[data-theme="light"] {${p1}--glass-rgb: 15, 23, 42;${p2}}`;
  }
);

const addVars = (block) => {
  if (block.includes('--foreground:')) return block; // already added

  const vars = `
  --foreground: var(--text-primary);
  --panel-bg: rgba(var(--glass-rgb), 0.03);
  --glass-border: rgba(var(--glass-rgb), 0.15);
  --glass-surface: rgba(var(--glass-rgb), 0.06);
  --glass-surface-heavy: rgba(var(--glass-rgb), 0.12);
  --sidebar-text-inactive: var(--text-inactive);
`;
  return block.replace(/\s*\}$/, `\n${vars}}\n`);
};

// Add variables to :root
css = css.replace(/:root\s*\{[\s\S]*?\}/, addVars);

// Add variables to all themes
css = css.replace(/\[data-theme="[^"]+"\]\s*\{[\s\S]*?\}/g, match => addVars(match));

fs.writeFileSync(path, css);
console.log('globals.css updated');
