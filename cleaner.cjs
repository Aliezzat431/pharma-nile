// delete-comments.js
const fs = require('fs');
const path = require('path');
const glob = require('glob'); // npm install glob

// يحذف التعليقات من ملف واحد
function stripComments(content) {
  // يحذف التعليقات متعددة الأسطر /* ... */
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // يحذف التعليقات ذات السطر الواحد //
  content = content.replace(/\/\/.*$/gm, '');
  
  return content;
}

// يعالج مجلد بالكامل
function processDirectory(dirPath) {
  const extensions = ['*.ts', '*.tsx', '*.js', '*.jsx'];
  
  extensions.forEach(ext => {
    const files = glob.sync(`${dirPath}/**/${ext}`, {
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
    });
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const cleaned = stripComments(content);
        
        if (content !== cleaned) {
          fs.writeFileSync(file, cleaned, 'utf8');
          console.log(`✅ Cleaned: ${file}`);
        }
      } catch (err) {
        console.error(`❌ Error: ${file}`, err.message);
      }
    });
  });
}

// استخدمه
processDirectory('./src');