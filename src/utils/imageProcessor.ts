export interface Point {
  x: number;
  y: number;
}

export interface DetectedRegion {
  id: string;
  center: Point;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  pixelCount: number;
}

export async function detectRedRegions(imageUrl: string): Promise<DetectedRegion[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Scale down for performance if needed, but let's keep original for accuracy
      // Or scale to a standard size like 1000x1000 to match our SVG coordinate system
      const targetWidth = 1000;
      const targetHeight = (img.height / img.width) * targetWidth;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imageData.data;
      const width = targetWidth;
      const height = targetHeight;

      const visited = new Uint8Array(width * height);
      const regions: DetectedRegion[] = [];

      // Helper to check if a pixel is "red"
      const isRed = (index: number) => {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        
        if (a < 50) return false; // Ignore transparent
        
        // Adjust these thresholds based on the specific "red" in the map
        // A typical red: R is high, G and B are relatively low
        // Also consider HSV/HSL for better color matching, but RGB is faster
        return r > 150 && g < 100 && b < 100;
      };

      // Connected Component Labeling (BFS)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x) * 4;
          const visitedIndex = y * width + x;

          if (!visited[visitedIndex] && isRed(pixelIndex)) {
            // Found a new region
            const queue: Point[] = [{ x, y }];
            visited[visitedIndex] = 1;
            
            let minX = x, maxX = x, minY = y, maxY = y;
            let sumX = 0, sumY = 0;
            let pixelCount = 0;

            while (queue.length > 0) {
              const p = queue.shift()!;
              sumX += p.x;
              sumY += p.y;
              pixelCount++;

              if (p.x < minX) minX = p.x;
              if (p.x > maxX) maxX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.y > maxY) maxY = p.y;

              // Check neighbors (4-way)
              const neighbors = [
                { x: p.x + 1, y: p.y },
                { x: p.x - 1, y: p.y },
                { x: p.x, y: p.y + 1 },
                { x: p.x, y: p.y - 1 }
              ];

              for (const n of neighbors) {
                if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                  const nVisitedIndex = n.y * width + n.x;
                  const nPixelIndex = (n.y * width + n.x) * 4;
                  
                  if (!visited[nVisitedIndex] && isRed(nPixelIndex)) {
                    visited[nVisitedIndex] = 1;
                    queue.push(n);
                  }
                }
              }
            }

            // Filter out very small noise regions (e.g., less than 20 pixels)
            if (pixelCount > 20) {
              regions.push({
                id: `region-${regions.length + 1}`,
                center: {
                  x: sumX / pixelCount,
                  y: sumY / pixelCount
                },
                bounds: { minX, minY, maxX, maxY },
                pixelCount
              });
            }
          }
        }
      }

      resolve(regions);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}
