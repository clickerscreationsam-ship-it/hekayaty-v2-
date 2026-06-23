import { storage } from './server/storage';

async function check() {
  const p = await storage.getProduct(512);
  console.log("PRODUCT:", p);
  process.exit(0);
}

check().catch(console.error);
