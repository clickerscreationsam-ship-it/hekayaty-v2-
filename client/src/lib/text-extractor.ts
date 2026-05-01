import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for PDF.js
// Set worker source for PDF.js using standard CDN (version matches installed package)
// We use .mjs for module support which Vite prefers
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
        return extractPdfText(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return extractDocxText(file);
    } else {
        throw new Error('Unsupported file type. Please upload PDF or DOCX.');
    }
}

async function extractPdfText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();

    // Use jsDelivr for reliable CMap loading
    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
    }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Bidirectional Smart Joining Logic
        let pageText = "";
        let lastItem: any = null;

        const items = textContent.items as any[];

        // Sort items by Y first (top to bottom) then X (visual order depends on bidi, but usually PDF stores in reading order or visual chunks)
        // However, simple iteration often works if we just check proximity.

        for (const item of items) {
            if (lastItem) {
                const x = item.transform[4];
                const y = item.transform[5];
                const w = item.width;
                const h = item.height || item.transform[3];

                const lastX = lastItem.transform[4];
                const lastY = lastItem.transform[5];
                const lastW = lastItem.width;
                const lastH = lastItem.height || lastItem.transform[3];

                // 1. New Line Detection
                const verticalGap = Math.abs(y - lastY);
                if (verticalGap > lastH * 0.5) {
                    pageText += "\n";
                } else {
                    // 2. Horizontal Gap Detection
                    // Calculate distance between segments.
                    // For LTR: gap = x - (lastX + lastW)
                    // For RTL: gap = lastX - (x + w)
                    // We take the minimum effective distance allowing for either direction

                    const dist1 = Math.abs(x - (lastX + lastW)); // LTR
                    const dist2 = Math.abs(lastX - (x + w));     // RTL
                    const gap = Math.min(dist1, dist2);

                    // Threshold: if gap is noticeable (> 20% of height), insert space
                    // Arabic letters are often very close or overlapping (gap ~ 0)
                    if (gap > (lastH * 0.2)) {
                        // Ensure we don't double space
                        if (!pageText.endsWith(" ") && !item.str.startsWith(" ") && item.str.trim() !== '') {
                            pageText += " ";
                        }
                    }
                }
            }

            pageText += item.str;
            lastItem = item;
        }

        fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
    }

    return fullText;
}

async function extractDocxText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}
