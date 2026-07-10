const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'components', 'layout', 'LayoutWrapper.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add import
if (!content.includes("import DeveloperWidget from './DeveloperWidget';")) {
  content = content.replace(
    "import { showToast } from '@/components/ui/SyncToastProvider';",
    "import { showToast } from '@/components/ui/SyncToastProvider';\nimport DeveloperWidget from './DeveloperWidget';"
  );
}

// 2. Add DeveloperWidget before closing div
const targetTag = "<ChatWidget />";
if (!content.includes("<DeveloperWidget />")) {
  // Replace the last occurrence of ChatWidget
  const index = content.lastIndexOf(targetTag);
  if (index !== -1) {
    content = content.slice(0, index + targetTag.length) + "\n      <DeveloperWidget />" + content.slice(index + targetTag.length);
  }
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('LayoutWrapper patched successfully!');
