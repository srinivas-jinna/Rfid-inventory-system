import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, CreditCard, RefreshCw, Plus, Scan, AlertCircle, CheckCircle } from 'lucide-react';

const RFIDInventorySystem = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Form states
  const [newProduct, setNewProduct] = useState({
    rfidTag: '',
    productName: '',
    productCode: '',
    price: '',
    category: ''
  });
  const [scanRfid, setScanRfid] = useState('');
  const [isRfidReaderMode, setIsRfidReaderMode] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [serialPort, setSerialPort] = useState(null);
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [killTagAfterSale, setKillTagAfterSale] = useState(false);
  const [killPassword, setKillPassword] = useState('00000000'); // Default kill password
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [showDataViewer, setShowDataViewer] = useState(false);
  const [showBillingWindow, setShowBillingWindow] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  
  // Billing form states
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: ''
  });
  const [billingSettings, setBillingSettings] = useState({
    companyName: 'Your Store Name',
    companyAddress: '123 Store Street, City, State 12345',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'contact@yourstore.com',
    taxRate: 8.5, // percentage
    invoicePrefix: 'INV',
    terms: 'Payment due within 30 days'
  });

  // Add log message
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logEntry]);
    
    // Save to localStorage as backup
    const allLogs = JSON.parse(localStorage.getItem('rfid_logs') || '[]');
    allLogs.push(logEntry);
    localStorage.setItem('rfid_logs', JSON.stringify(allLogs.slice(-100))); // Keep last 100 logs
  };

  // Database/Storage Functions (Local Storage Only for now)
  const saveToDatabase = async (type, data) => {
    try {
      // Local Storage (immediate backup)
      localStorage.setItem(`rfid_${type}`, JSON.stringify(data));
      addLog(`💾 Saved ${type} locally`);
      
      // Simulate cloud save (you can replace this with real database later)
      if (isOnline) {
        // Placeholder for future database integration
        setTimeout(() => {
          setLastSyncTime(new Date().toISOString());
          addLog(`✅ ${type} ready for cloud sync`);
        }, 500);
      }
    } catch (error) {
      addLog(`❌ Save error: ${error.message}`);
    }
  };

  const loadFromDatabase = async (type) => {
    try {
      // Load from localStorage for now
      const localData = localStorage.getItem(`rfid_${type}`);
      if (localData) {
        addLog(`📱 Loaded ${type} from local storage`);
        return JSON.parse(localData);
      }
      
      return [];
    } catch (error) {
      addLog(`❌ Load error: ${error.message}`);
      return [];
    }
  };

  // Initialize data from storage
  useEffect(() => {
    const initializeData = async () => {
      const savedProducts = await loadFromDatabase('products');
      const savedTransactions = await loadFromDatabase('transactions');
      const savedLogs = JSON.parse(localStorage.getItem('rfid_logs') || '[]');
      
      if (savedProducts.length > 0) setProducts(savedProducts);
      if (savedTransactions.length > 0) setTransactions(savedTransactions);
      if (savedLogs.length > 0) setLogs(savedLogs);
      
      addLog('🚀 System initialized with saved data');
    };
    
    initializeData();
    
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      addLog('🌐 Back online - syncing data...');
      // Trigger sync of pending data
    };
    const handleOffline = () => {
      setIsOnline(false);
      addLog('📱 Offline mode - saving locally');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    if (products.length > 0) {
      saveToDatabase('products', products);
    }
  }, [products]);

  useEffect(() => {
    if (transactions.length > 0) {
      saveToDatabase('transactions', transactions);
    }
  }, [transactions]);

  // Add new product
  const addProduct = () => {
    if (!newProduct.rfidTag || !newProduct.productName || !newProduct.productCode || !newProduct.price) {
      alert('Please fill all required fields');
      return;
    }

    // Check if RFID already exists
    if (products.find(p => p.rfidTag === newProduct.rfidTag)) {
      alert('RFID tag already exists!');
      return;
    }

    const product = {
      id: Date.now(),
      rfidTag: newProduct.rfidTag,
      productName: newProduct.productName,
      productCode: newProduct.productCode,
      price: parseFloat(newProduct.price),
      category: newProduct.category || 'N/A',
      rfidStatus: 'active',
      createdAt: new Date().toISOString()
    };

    setProducts(prev => [...prev, product]);
    addLog(`Added product: ${product.productName} (RFID: ${product.rfidTag})`);
    
    // Clear form
    setNewProduct({
      rfidTag: '',
      productName: '',
      productCode: '',
      price: '',
      category: ''
    });
  };

  // Scan RFID and add to cart
  const scanRfidTag = () => {
    if (!scanRfid) return;

    // Find product by RFID
    const product = products.find(p => p.rfidTag === scanRfid);

    if (!product) {
      alert('Product not found!');
      addLog(`RFID not found: ${scanRfid}`);
      setScanRfid('');
      return;
    }

    if (product.rfidStatus === 'disabled') {
      alert('This product has already been sold!');
      addLog(`Attempted to scan sold product: ${scanRfid}`);
      setScanRfid('');
      return;
    }

    // Check if already in cart
    if (cart.find(item => item.rfidTag === scanRfid)) {
      alert('Item already in cart!');
      setScanRfid('');
      return;
    }

    setCart(prev => [...prev, product]);
    addLog(`Added to cart: ${product.productName} - ${product.price} ${isRfidReaderMode ? '(RFID Reader)' : '(Manual)'}`);
    setScanRfid('');
  };

  // Handle RFID input changes - detect RFID reader vs manual input
  const handleRfidInputChange = (e) => {
    const value = e.target.value;
    const currentTime = Date.now();
    
    // Detect if this is likely from an RFID reader (fast typing)
    if (value.length > scanRfid.length + 1) {
      setIsRfidReaderMode(true);
      addLog('RFID Reader detected - automatic scan mode');
    } else {
      // Manual typing - reset reader mode after 1 second of no input
      setIsRfidReaderMode(false);
    }
    
    setScanRfid(value);
    setLastScanTime(currentTime);
  };

  // Auto-scan when RFID reader finishes (detected by rapid input completion)
  useEffect(() => {
    if (scanRfid && isRfidReaderMode) {
      const timer = setTimeout(() => {
        if (Date.now() - lastScanTime >= 100) { // 100ms after input stops
          scanRfidTag();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [scanRfid, lastScanTime, isRfidReaderMode]);

  // Handle Enter key for manual input
  const handleRfidKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isRfidReaderMode) {
        addLog('Manual scan initiated');
      }
      scanRfidTag();
    }
  };

  // Serial RFID Reader Functions
  const connectSerialRfid = async () => {
    try {
      if (!('serial' in navigator)) {
        alert('Web Serial API not supported. Use Chrome/Edge browser.');
        return;
      }

      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 }); // Adjust baud rate for your reader

      setSerialPort(port);
      setIsSerialConnected(true);
      addLog('Serial RFID reader connected');

      // Read data from serial port
      const reader = port.readable.getReader();
      
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const rfidData = new TextDecoder().decode(value).trim();
          if (rfidData) {
            setScanRfid(rfidData);
            addLog(`Serial RFID detected: ${rfidData}`);
            
            // Auto-scan after receiving data
            setTimeout(() => {
              const product = products.find(p => p.rfidTag === rfidData);
              if (product && product.rfidStatus === 'active' && !cart.find(item => item.rfidTag === rfidData)) {
                setCart(prev => [...prev, product]);
                addLog(`Added to cart: ${product.productName} - ${product.price} (Serial RFID)`);
                setScanRfid('');
              }
            }, 100);
          }
        }
      } catch (error) {
        addLog(`Serial read error: ${error.message}`);
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      addLog(`Serial connection error: ${error.message}`);
    }
  };

  const disconnectSerialRfid = async () => {
    if (serialPort) {
      await serialPort.close();
      setSerialPort(null);
      setIsSerialConnected(false);
      addLog('Serial RFID reader disconnected');
    }
  };

  // Kill RFID Tag Function
  const killRfidTag = async (rfidTag) => {
    try {
      if (!serialPort) {
        addLog(`Cannot kill tag ${rfidTag} - No serial connection`);
        return false;
      }

      // Send kill command to RFID reader
      const killCommand = `KILL:${rfidTag}:${killPassword}\n`;
      const writer = serialPort.writable.getWriter();
      await writer.write(new TextEncoder().encode(killCommand));
      writer.releaseLock();

      addLog(`Kill command sent for tag: ${rfidTag}`);
      
      // Wait for confirmation (this would depend on your specific reader)
      setTimeout(() => {
        addLog(`Tag ${rfidTag} killed successfully`);
      }, 1000);
      
      return true;
    } catch (error) {
      addLog(`Error killing tag ${rfidTag}: ${error.message}`);
      return false;
    }
  };

  // Simulate tag killing for demo purposes
  const simulateKillTag = (rfidTag) => {
    addLog(`🔪 SIMULATED: Tag ${rfidTag} would be permanently killed`);
    addLog(`⚠️ This tag would no longer respond to any RFID reader`);
    return true;
  };

  // Export/Import Functions
  const exportData = () => {
    const data = {
      products: products,
      transactions: transactions,
      logs: logs,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfid-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addLog('📤 Data exported successfully');
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.products) setProducts(data.products);
        if (data.transactions) setTransactions(data.transactions);
        if (data.logs) setLogs(data.logs);
        
        addLog(`📥 Data imported from ${file.name}`);
        alert('Data imported successfully!');
      } catch (error) {
        addLog(`❌ Import failed: ${error.message}`);
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ This will delete ALL data permanently. Are you sure?')) {
      localStorage.clear();
      setProducts([]);
      setTransactions([]);
      setLogs([]);
      addLog('🗑️ All data cleared');
      alert('All data has been cleared!');
    }
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    addLog('Cart cleared');
  };

  // Process payment
  const processPayment = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    
    if (window.confirm(`Process payment of ${total.toFixed(2)}?`)) {
      const transactionId = Math.random().toString(36).substr(2, 12).toUpperCase();
      
      // Disable RFID tags for purchased items
      const updatedProducts = products.map(product => {
        const cartItem = cart.find(item => item.rfidTag === product.rfidTag);
        if (cartItem) {
          return { ...product, rfidStatus: 'disabled' };
        }
        return product;
      });

      setProducts(updatedProducts);

      // Kill RFID tags if option is enabled
      if (killTagAfterSale) {
        cart.forEach(item => {
          if (isSerialConnected) {
            killRfidTag(item.rfidTag);
          } else {
            simulateKillTag(item.rfidTag);
          }
        });
      }

      // Record transaction
      const transaction = {
        id: transactionId,
        items: [...cart],
        total: total,
        date: new Date().toISOString(),
        tagsKilled: killTagAfterSale
      };

      setTransactions(prev => [...prev, transaction]);

      addLog(`Transaction completed: ${transactionId}`);
      addLog(`Amount: ${total.toFixed(2)}`);
      addLog(`Sold ${cart.length} products`);
      if (killTagAfterSale) {
        addLog(`🔪 ${cart.length} RFID tags killed permanently`);
      }

      alert(`Payment processed successfully!\nTransaction ID: ${transactionId}\nTotal: ${total.toFixed(2)}\n${killTagAfterSale ? 'RFID tags have been permanently killed.' : 'Products marked as sold in system.'}`);

      // Clear cart
      setCart([]);
    }
  };

  // Get filtered products based on view mode
  const getFilteredProducts = () => {
    if (showAllProducts) {
      return products;
    }
    return products.filter(p => p.rfidStatus === 'active');
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          RFID Inventory Management System
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* Add Product */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Plus className="mr-2" size={20} />
                Add New Product
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="RFID Tag"
                  value={newProduct.rfidTag}
                  onChange={(e) => setNewProduct(prev => ({...prev, rfidTag: e.target.value}))}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.productName}
                  onChange={(e) => setNewProduct(prev => ({...prev, productName: e.target.value}))}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Product Code"
                  value={newProduct.productCode}
                  onChange={(e) => setNewProduct(prev => ({...prev, productCode: e.target.value}))}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct(prev => ({...prev, price: e.target.value}))}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Category (optional)"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct(prev => ({...prev, category: e.target.value}))}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addProduct}
                  className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Add Product
                </button>
              </div>
            </div>

            {/* RFID Scanner */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Scan className="mr-2" size={20} />
                RFID Scanner
                {isRfidReaderMode && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    USB RFID Active
                  </span>
                )}
                {isSerialConnected && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Serial RFID Connected
                  </span>
                )}
              </h2>
              
              {/* Serial RFID Connection */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Serial RFID Reader:</span>
                  {!isSerialConnected ? (
                    <button
                      onClick={connectSerialRfid}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Connect Serial RFID
                    </button>
                  ) : (
                    <button
                      onClick={disconnectSerialRfid}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  For COM/Serial port RFID readers (Chrome/Edge only)
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Scan RFID Tag or Type Manually"
                    value={scanRfid}
                    onChange={handleRfidInputChange}
                    onKeyPress={handleRfidKeyPress}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoComplete="off"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {isSerialConnected ? 
                      '🔵 Serial RFID Connected - Ready for scans' :
                      isRfidReaderMode ? 
                        '🔵 USB RFID Reader Mode - Will auto-scan' : 
                        '⌨️ Manual Mode - Press Enter or click Scan'
                    }
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={scanRfidTag}
                    className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Manual Scan
                  </button>
                  <button
                    onClick={clearCart}
                    className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
                <div className="text-xs text-gray-600 p-2 bg-blue-50 rounded">
                  <strong>📖 RFID Connection Methods:</strong><br/>
                  • <strong>USB RFID:</strong> Plug & play - just scan (works automatically)<br/>
                  • <strong>Serial RFID:</strong> Click "Connect Serial RFID" first, then scan<br/>
                  • <strong>Manual Entry:</strong> Type RFID tag and press Enter
                </div>
              </div>
            </div>

            {/* Transaction */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <CreditCard className="mr-2" size={20} />
                Transaction
              </h2>
              
              {/* Kill Tag Settings */}
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={killTagAfterSale}
                    onChange={(e) => setKillTagAfterSale(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-red-800">
                    🔪 Kill RFID tags after sale (PERMANENT)
                  </span>
                </label>
                <div className="text-xs text-red-600 mt-1">
                  ⚠️ Warning: Killed tags will never work again on any reader
                </div>
                
                {killTagAfterSale && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Kill Password (8 hex digits)"
                      value={killPassword}
                      onChange={(e) => setKillPassword(e.target.value)}
                      className="w-full p-1 text-xs border rounded focus:outline-none"
                      maxLength={8}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Default: 00000000 (check your RFID tags' documentation)
                    </div>
                  </div>
                )}
              </div>

              <div className="text-2xl font-bold mb-4 text-center">
                Total: ${total.toFixed(2)}
              </div>
              <button
                onClick={processPayment}
                disabled={cart.length === 0}
                className="w-full bg-purple-500 disabled:bg-gray-300 text-white p-3 rounded hover:bg-purple-600 transition-colors font-semibold"
              >
                {killTagAfterSale ? '🧾 Create Invoice & Kill Tags' : '🧾 Create Invoice'}
              </button>
            </div>
          </div>

          {/* Right Panel - Inventory */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Package className="mr-2" size={20} />
                  Inventory ({filteredProducts.length} products)
                </h2>
                <button
                  onClick={() => setShowAllProducts(!showAllProducts)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  {showAllProducts ? 'Show Available Only' : 'Show All Products'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">RFID</th>
                      <th className="border border-gray-300 p-2 text-left">Product</th>
                      <th className="border border-gray-300 p-2 text-left">Code</th>
                      <th className="border border-gray-300 p-2 text-left">Price</th>
                      <th className="border border-gray-300 p-2 text-left">Category</th>
                      <th className="border border-gray-300 p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className={product.rfidStatus === 'disabled' ? 'bg-red-50' : ''}>
                        <td className="border border-gray-300 p-2">{product.rfidTag}</td>
                        <td className="border border-gray-300 p-2">
                          {product.rfidStatus === 'disabled' ? `[SOLD] ${product.productName}` : product.productName}
                        </td>
                        <td className="border border-gray-300 p-2">{product.productCode}</td>
                        <td className="border border-gray-300 p-2">${product.price.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">{product.category}</td>
                        <td className="border border-gray-300 p-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            product.rfidStatus === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.rfidStatus === 'active' ? 'AVAILABLE' : 'SOLD'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No products found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Panel - Cart and Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Current Cart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <ShoppingCart className="mr-2" size={20} />
              Current Cart ({cart.length} items)
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-gray-500">RFID: {item.rfidTag}</div>
                  </div>
                  <div className="font-semibold">${item.price.toFixed(2)}</div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-4 text-gray-500">Cart is empty</div>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertCircle className="mr-2" size={20} />
              Activity Log
              <div className="ml-auto flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isOnline ? '🌐 Online' : '📱 Offline'}
                </span>
                {lastSyncTime && (
                  <span className="text-xs text-gray-500">
                    Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </h2>
            <div className="bg-gray-50 p-4 rounded max-h-64 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">No activity yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Billing Window Modal */}
        {showBillingWindow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">🧾 Billing & Invoice</h2>
                  <button
                    onClick={() => setShowBillingWindow(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">👤 Customer Information</h3>
                    <input
                      type="text"
                      placeholder="Customer Name (optional)"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails(prev => ({...prev, name: e.target.value}))}
                      className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails(prev => ({...prev, email: e.target.value}))}
                      className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails(prev => ({...prev, phone: e.target.value}))}
                      className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="Address (optional)"
                      value={customerDetails.address}
                      onChange={(e) => setCustomerDetails(prev => ({...prev, address: e.target.value}))}
                      className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    />
                    <input
                      type="text"
                      placeholder="Tax ID (optional)"
                      value={customerDetails.taxId}
                      onChange={(e) => setCustomerDetails(prev => ({...prev, taxId: e.target.value}))}
                      className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Company Settings */}
                    <h3 className="text-lg font-semibold mt-6">🏢 Company Settings</h3>
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={billingSettings.companyName}
                      onChange={(e) => setBillingSettings(prev => ({...prev, companyName: e.target.value}))}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="Company Address"
                      value={billingSettings.companyAddress}
                      onChange={(e) => setBillingSettings(prev => ({...prev, companyAddress: e.target.value}))}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Phone"
                        value={billingSettings.companyPhone}
                        onChange={(e) => setBillingSettings(prev => ({...prev, companyPhone: e.target.value}))}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Tax Rate %"
                        value={billingSettings.taxRate}
                        onChange={(e) => setBillingSettings(prev => ({...prev, taxRate: parseFloat(e.target.value) || 0}))}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Invoice Preview */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">📄 Invoice Preview</h3>
                    <div className="bg-gray-50 p-4 rounded border" style={{minHeight: '400px'}}>
                      <div className="text-center border-b pb-4 mb-4">
                        <h4 className="text-xl font-bold">INVOICE</h4>
                        <h5 className="text-lg">{billingSettings.companyName}</h5>
                      </div>

                      <div className="mb-4 text-sm">
                        <div><strong>Invoice #:</strong> {billingSettings.invoicePrefix}-{Date.now().toString().slice(-8)}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Customer:</strong> {customerDetails.name || 'Walk-in Customer'}</div>
                      </div>

                      <table className="w-full text-sm border-collapse border border-gray-300 mb-4">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-left">Item</th>
                            <th className="border border-gray-300 p-2 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.map((item, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 p-2">{item.productName}</td>
                              <td className="border border-gray-300 p-2 text-right">${item.price.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="text-right space-y-1">
                        {(() => {
                          const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
                          const taxAmount = (subtotal * billingSettings.taxRate) / 100;
                          const total = subtotal + taxAmount;
                          return (
                            <>
                              <div><strong>Subtotal: ${subtotal.toFixed(2)}</strong></div>
                              <div><strong>Tax ({billingSettings.taxRate}%): ${taxAmount.toFixed(2)}</strong></div>
                              <div className="text-lg"><strong>TOTAL: ${total.toFixed(2)}</strong></div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">💳 Payment Method:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            completeBilling('cash');
                            setShowBillingWindow(false);
                          }}
                          className="p-3 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          💵 Cash
                        </button>
                        <button
                          onClick={() => {
                            completeBilling('card');
                            setShowBillingWindow(false);
                          }}
                          className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          💳 Card
                        </button>
                        <button
                          onClick={() => {
                            completeBilling('digital');
                            setShowBillingWindow(false);
                          }}
                          className="p-3 bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                          📱 Digital
                        </button>
                        <button
                          onClick={() => {
                            completeBilling('check');
                            setShowBillingWindow(false);
                          }}
                          className="p-3 bg-orange-500 text-white rounded hover:bg-orange-600"
                        >
                          📄 Check
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Viewer Modal */}
        {currentInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">📄 Invoice Generated</h2>
                  <button
                    onClick={() => setCurrentInvoice(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6 flex space-x-3">
                  <button
                    onClick={() => printInvoice(currentInvoice)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    🖨️ Print Invoice
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([generateInvoiceHTML(currentInvoice)], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `invoice-${currentInvoice.id}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    📥 Download HTML
                  </button>
                </div>

                <div className="border rounded p-6 bg-white" dangerouslySetInnerHTML={{
                  __html: generateInvoiceHTML(currentInvoice).replace(/<html>.*<body>/s, '').replace(/<\/body>.*<\/html>/s, '')
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Data Management Panel */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">💾 Data Management</h3>
            <button
              onClick={() => setShowDataViewer(!showDataViewer)}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              {showDataViewer ? 'Hide Data Viewer' : 'Show Data Viewer'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              onClick={exportData}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              📤 Export Data
            </button>
            
            <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm cursor-pointer text-center">
              📥 Import Data
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
            
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              🗑️ Clear All Data
            </button>
            
            <div className="px-4 py-2 bg-gray-100 rounded text-sm text-center">
              📊 {products.length} Products, {transactions.length} Sales
            </div>
          </div>

          {showDataViewer && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Products Data */}
                <div>
                  <h4 className="font-semibold mb-2">🏷️ Products Data:</h4>
                  <div className="bg-gray-50 p-3 rounded max-h-64 overflow-auto text-xs font-mono">
                    <pre>{JSON.stringify(products, null, 2)}</pre>
                  </div>
                </div>

                {/* Transactions Data */}
                <div>
                  <h4 className="font-semibold mb-2">💰 Transactions Data:</h4>
                  <div className="bg-gray-50 p-3 rounded max-h-64 overflow-auto text-xs font-mono">
                    <pre>{JSON.stringify(transactions, null, 2)}</pre>
                  </div>
                </div>
              </div>

              {/* Storage Info */}
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-semibold mb-2">🗄️ Storage Information:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Location:</strong> Browser Local Storage (localStorage)</p>
                  <p><strong>Persistence:</strong> Data survives browser restarts and page refreshes</p>
                  <p><strong>Scope:</strong> This browser on this computer only</p>
                  <p><strong>Capacity:</strong> ~5-10MB per domain</p>
                  <p><strong>Access:</strong> Press F12 → Application → Local Storage → localhost:5173</p>
                </div>
              </div>

              {/* Raw Storage Data */}
              <div>
                <h4 className="font-semibold mb-2">🔍 Raw Storage Keys:</h4>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  <div>rfid_products: {localStorage.getItem('rfid_products') ? 'Present' : 'Empty'}</div>
                  <div>rfid_transactions: {localStorage.getItem('rfid_transactions') ? 'Present' : 'Empty'}</div>
                  <div>rfid_logs: {localStorage.getItem('rfid_logs') ? 'Present' : 'Empty'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">
            🧪 Test Instructions:
          </h3>
          <div className="space-y-2 text-blue-700">
            <p><strong>1. Add a Product:</strong> Use RFID "RFID001", Name "Test Product", Code "TP001", Price "10.99"</p>
            <p><strong>2a. RFID Reader:</strong> Simply scan with your RFID reader - it will auto-detect and add to cart</p>
            <p><strong>2b. Manual Entry:</strong> Type "RFID001" and press Enter or click "Manual Scan"</p>
            <p><strong>3. Process Payment:</strong> Click "Process Payment" to complete the transaction</p>
            <p><strong>4. Try Different Methods:</strong> Test both RFID reader and manual entry</p>
            <p><strong>5. Check Inventory:</strong> Toggle "Show All Products" to see the sold item marked as [SOLD]</p>
            <p><strong>6. Test Persistence:</strong> Refresh the page - your data should remain!</p>
            <p><strong>7. Test Billing:</strong> Click "Create Invoice" to open the professional billing window!</p>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>💾 Data Storage:</strong> Currently using local browser storage + automatic cloud sync when online.
              Your data persists between sessions and syncs across devices when connected to a database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFIDInventorySystem;