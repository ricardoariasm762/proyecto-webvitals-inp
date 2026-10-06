const fs = require('fs');
const path = require('path');

const browserDir = path.resolve(__dirname, '../extension/ui/browser');
const targetDir = path.resolve(__dirname, '../extension/ui');

if (fs.existsSync(browserDir)) {
  fs.cpSync(browserDir, targetDir, { recursive: true });
  console.log('Archivos de compilación de Angular copiados a extension/ui/');
}
