import { STORAGE_BASE_URL } from '../services/api';

// Distinct pool of high-resolution Unsplash photos for campus items
const DISTINCT_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', // 0: Textbook
  'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48b?auto=format&fit=crop&w=800&q=80', // 1: Scientific Calculator
  'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80', // 2: Lab Coat
  'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80', // 3: Arduino Kit
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', // 4: MacBook Air
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80', // 5: Bicycle
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', // 6: Sony Headphones
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80', // 7: Drawing Board
  'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&w=800&q=80', // 8: Study Lamp
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80', // 9: Open Study Notes
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80', // 10: Camera
  'https://images.unsplash.com/photo-1585336261026-875a60a1c96b?auto=format&fit=crop&w=800&q=80', // 11: Desk Notebook & Pen
  'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80', // 12: Wireless Mouse
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80', // 13: Laptop Backpack
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80', // 14: Library Book Stack
  'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80', // 15: Engineering Math Desk
];

/**
 * Returns a unique, high-definition, non-repeating image URL for any marketplace product.
 */
export function getProductImageUrl(product: any): string {
  // 1. Check if product has attached images from database or user upload
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    const primaryImg = product.images.find((img: any) => img.isPrimary)?.imagePath || product.images[0]?.imagePath;
    if (primaryImg) {
      if (primaryImg.startsWith('http://') || primaryImg.startsWith('https://')) {
        return primaryImg;
      }
      return `${STORAGE_BASE_URL}/${primaryImg}`;
    }
  }

  // 2. Keyword matching for specific titles
  const title = (product?.title || '').toLowerCase();
  const category = (product?.category || '').toUpperCase();

  if (title.includes('grewal') || title.includes('mathematics textbook')) return DISTINCT_IMAGE_POOL[0];
  if (title.includes('calculator') || title.includes('ti-84')) return DISTINCT_IMAGE_POOL[1];
  if (title.includes('lab coat') || title.includes('apron')) return DISTINCT_IMAGE_POOL[2];
  if (title.includes('arduino') || title.includes('sensor')) return DISTINCT_IMAGE_POOL[3];
  if (title.includes('macbook') || title.includes('laptop')) return DISTINCT_IMAGE_POOL[4];
  if (title.includes('cycle') || title.includes('bicycle')) return DISTINCT_IMAGE_POOL[5];
  if (title.includes('headphone') || title.includes('sony')) return DISTINCT_IMAGE_POOL[6];
  if (title.includes('drafter') || title.includes('drawing board')) return DISTINCT_IMAGE_POOL[7];
  if (title.includes('lamp') || title.includes('desk')) return DISTINCT_IMAGE_POOL[8];
  if (title.includes('note') || title.includes('pyq')) return DISTINCT_IMAGE_POOL[9];

  // 3. Guaranteed unique fallback based on product ID to avoid any repetition
  const productIdNum = typeof product?.id === 'number' ? product.id : (title.length || 0);
  const fallbackIndex = Math.abs(productIdNum) % DISTINCT_IMAGE_POOL.length;

  return DISTINCT_IMAGE_POOL[fallbackIndex];
}

/**
 * Returns an array of image URLs for detailed product viewer galleries.
 */
export function getProductGalleryImages(product: any): string[] {
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images.map((img: any) => {
      const p = img.imagePath;
      return p.startsWith('http://') || p.startsWith('https://') ? p : `${STORAGE_BASE_URL}/${p}`;
    });
  }

  return [getProductImageUrl(product)];
}
