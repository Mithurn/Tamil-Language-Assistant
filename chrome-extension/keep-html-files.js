// Script to keep HTML files after webpack build
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

// Ensure HTML files exist after build
const htmlFiles = [
    'popup.html',
    'sidepanel.html',
    'sidepanel-simple.html',
    'sidepanel-fallback.html'
];

htmlFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`Creating missing HTML file: ${file}`);
        if (file === 'popup.html') {
            fs.writeFileSync(filePath, `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tamil AI Assistant</title>
</head>
<body>
    <div id="root"></div>
    <script src="popup.js"></script>
</body>
</html>`);
        } else if (file === 'sidepanel.html') {
            fs.writeFileSync(filePath, `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tamil AI Assistant</title>
</head>
<body>
    <div id="root"></div>
    <script src="sidepanel.js"></script>
</body>
</html>`);
        } else if (file === 'sidepanel-simple.html') {
            // Create a simple working version
            fs.writeFileSync(filePath, `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tamil AI Assistant</title>
</head>
<body>
    <div>Tamil AI Side Panel - Simple Version</div>
</body>
</html>`);
        } else if (file === 'sidepanel-fallback.html') {
            // This file is large, so we'll just create a placeholder
            fs.writeFileSync(filePath, `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tamil AI Assistant</title>
</head>
<body>
    <div>Tamil AI Side Panel - Fallback Version</div>
</body>
</html>`);
        }
    }
});

console.log('HTML files check completed');
