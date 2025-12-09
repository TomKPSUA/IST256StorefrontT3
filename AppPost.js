// AppPost.js
// Simple HTTPS + Express + MongoDB API for IST 256 Storefront
// Thomas Koltes, Jaden Reyes, David Choe

// Pull in the node modules we need.
const express = require('express');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

// Make the express app object.
const app = express();

// This lets Express automatically parse JSON bodies from the client.
app.use(bodyParser.json());

// ================== Team-specific settings ==================
// NOTE: Replace the X with your actual team number.
// For example, Team 3 would usually use 3003 and team3/team3DB.
const port = 3003;                  // <--- change to 300X for your team
const ipAddress = '130.203.136.203';

// HTTPS certificate paths (these live on the server already).
const options = {
  key: fs.readFileSync('/data/ist256.key'),
  cert: fs.readFileSync('/data/ist256.cert'),
};

// ================== CORS so the browser can talk to us ==================
app.use((req, res, next) => {
  // Allow any page to call this API (for our class demo).
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Browser preflight request shortcut.
    return res.sendStatus(200);
  }
  next();
});

// ================== MongoDB connection setup ==================
// Thomas K: update this URI with YOUR team’s MongoDB user and password.
const uri = 'mongodb://team3:team3@localhost:27017'; // <--- change team3/team3

const client = new MongoClient(uri);

// Helper so we only spell the DB name in one place.
function getDb() {
  // Jaden R: team database name – change to what professor told you (ex: team3DB).
  return client.db('team3DB'); // <--- change to teamXDB
}

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Connect once when the server starts.
connectToMongoDB().catch(console.error);

// ================== Static assets (if needed later) ==================
// This would serve /assets/... from a local folder named public/assets
app.use('/assets', express.static('public/assets'));

// ================== Simple test routes ==================
app.get('/', (req, res) => {
  res.status(200).send('Secure HTTPS – Storefront API is alive');
  console.log('GET / called');
});

app.get('/hello', (req, res) => {
  res.send('Hello from secure HTTPS');
});

// ================== API routes for your collections ==================
// Each page in the storefront sends JSON to one of these endpoints.
// We then store the JSON in its matching MongoDB collection.

// ---------- Shopper page JSON -> shopper collection ----------
app.post('/api/shopper', async (req, res) => {
  const shopperData = req.body;
  console.log('Received shopper data:', JSON.stringify(shopperData, null, 2));

  try {
    const db = getDb();
    const collection = db.collection('shopper'); // collection: shopper
    const result = await collection.insertOne(shopperData);
    console.log('Shopper saved with _id:', result.insertedId);

    res.status(200).json({
      message: 'Shopper document saved to MongoDB',
      shopperId: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving shopper to MongoDB:', error);
    res.status(500).json({ message: 'Failed to save shopper' });
  }
});

// ---------- Products page JSON -> products collection ----------
app.post('/api/products', async (req, res) => {
  const productData = req.body; // could be a single product or an array
  console.log('Received product data:', JSON.stringify(productData, null, 2));

  try {
    const db = getDb();
    const collection = db.collection('products');
    const result = await collection.insertOne(productData);
    console.log('Product doc saved with _id:', result.insertedId);

    res.status(200).json({
      message: 'Product JSON saved to MongoDB',
      productId: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving product to MongoDB:', error);
    res.status(500).json({ message: 'Failed to save product JSON' });
  }
});

// (Optional) Example GET products (prof’s sample had this too)
app.get('/api/products', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('products');
    const products = await collection.find().toArray();
    console.log('Products fetched:', products.length);

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// ---------- Shopping cart page JSON -> shopping_cart collection ----------
app.post('/api/cart', async (req, res) => {
  const cartData = req.body; // ex: { shopperId:'...', cart:[...] }
  console.log('Received cart data:', JSON.stringify(cartData, null, 2));

  try {
    const db = getDb();
    const collection = db.collection('shopping_cart');
    const result = await collection.insertOne(cartData);
    console.log('Cart doc saved with _id:', result.insertedId);

    res.status(200).json({
      message: 'Shopping cart JSON saved to MongoDB',
      cartId: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving cart to MongoDB:', error);
    res.status(500).json({ message: 'Failed to save cart JSON' });
  }
});

// ---------- Shipping/Billing page JSON -> shipping_billing collection ----------
app.post('/api/shippingBilling', async (req, res) => {
  const shipBillData = req.body; // ex: { shopper:{}, shipping:{}, billing:{} }
  console.log(
    'Received shipping/billing data:',
    JSON.stringify(shipBillData, null, 2)
  );

  try {
    const db = getDb();
    const collection = db.collection('shipping_billing');
    const result = await collection.insertOne(shipBillData);
    console.log('Shipping/Billing doc saved with _id:', result.insertedId);

    res.status(200).json({
      message: 'Shipping/Billing JSON saved to MongoDB',
      recordId: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving shipping/billing to MongoDB:', error);
    res.status(500).json({ message: 'Failed to save shipping/billing JSON' });
  }
});

// ---------- Returns page JSON -> returns collection ----------
app.post('/api/returns', async (req, res) => {
  const returnData = req.body; // ex: { shopperId:'...', returns:[...] }
  console.log('Received return data:', JSON.stringify(returnData, null, 2));

  try {
    const db = getDb();
    const collection = db.collection('returns');
    const result = await collection.insertOne(returnData);
    console.log('Return doc saved with _id:', result.insertedId);

    res.status(200).json({
      message: 'Return JSON saved to MongoDB',
      returnId: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving return to MongoDB:', error);
    res.status(500).json({ message: 'Failed to save return JSON' });
  }
});

// (Optional) If your prof still wants a generic /api/order like in his sample
// you can keep something like this, pointing at "orders":
app.post('/api/order', async (req, res) => {
  const orderData = req.body;
  console.log('Received order data (optional route):', JSON.stringify(orderData, null, 2));

  try {
    const db = getDb();
    const collection = db.collection('orders');
    const result = await collection.insertOne(orderData);
    console.log('Order saved with _id:', result.insertedId);

    res.status(200).json({
      message: 'Order JSON saved to MongoDB',
      orderId: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving order to MongoDB:', error);
    res.status(500).json({ message: 'Failed to save order JSON' });
  }
});

// ================== Start HTTPS server ==================
const server = https.createServer(options, app);

server.listen(port, () => {
  console.log(`Secure server is running on https://${ipAddress}:${port}`);
});
