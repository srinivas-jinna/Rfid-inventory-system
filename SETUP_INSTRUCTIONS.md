# RFID Inventory Management System - Setup Instructions

## Quick Start (3 methods available)

### Method 1: HTML Version (No setup required)
1. Open `rfid-inventory.html` in any web browser
2. Start using immediately!

### Method 2: React Development Setup
1. Make sure you have Node.js installed
2. Open terminal/command prompt in the project folder
3. Run these commands:
```bash
npm install
npm run dev
```
4. Open http://localhost:5173 in your browser

### Method 3: React Production Build
```bash
npm install
npm run build
npm run preview
```

## Files Included

### For HTML Version:
- `rfid-inventory.html` - Complete standalone application

### For React Version:
- `package.json` - Dependencies and scripts
- `src/App.jsx` - Main React component
- `src/index.css` - Tailwind CSS imports
- `src/main.jsx` - React app entry point
- `index.html` - HTML template
- `tailwind.config.js` - Tailwind configuration
- `vite.config.js` - Vite build configuration

## Additional Setup for React Version

### Install Tailwind CSS (if not working):
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Update src/index.css:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## System Requirements
- Node.js 16+ (for React version)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software needed for HTML version

## Testing the System

### Test Scenario:
1. **Add Product**: RFID "RFID001", Name "Test Product", Code "TP001", Price "10.99"
2. **Scan RFID**: Enter "RFID001" in scanner
3. **Process Payment**: Complete the transaction
4. **Verify**: Try scanning "RFID001" again (should show "already sold")
5. **Check Inventory**: Toggle "Show All Products" to see sold items

## Features
- ✅ Add products with RFID tags
- ✅ Scan RFID to add to cart
- ✅ Process payments and transactions
- ✅ Real-time inventory tracking
- ✅ Activity logging
- ✅ Sold item tracking
- ✅ Responsive design

## Troubleshooting

### React Version Issues:
- Make sure Node.js is installed: `node --version`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check if port 5173 is available

### HTML Version Issues:
- Ensure the HTML file is complete
- Try different browsers
- Check browser console for errors

## Support
- Check the browser console for error messages
- Ensure all dependencies are installed for React version
- For HTML version, just open in any modern browser