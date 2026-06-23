import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfReaderProps {
  productId: number;
  pdfUrl: string;
  initialPage?: number;
  onProgressUpdate?: (page: number) => void;
}

export function PdfReader({ productId, pdfUrl, initialPage = 1, onProgressUpdate }: PdfReaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [numPages, setNumPages] = useState<number>();
  
  // Initialize page from local storage or fallback to initialPage
  const [pageNumber, setPageNumber] = useState<number>(() => {
    const saved = localStorage.getItem(`pdf_progress_${productId}`);
    return saved ? parseInt(saved, 10) : initialPage;
  });
  
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent default behaviors (context menu, copy, drag)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast({
        title: "Security Alert",
        description: "Copying content is disabled for copyright protection.",
        variant: "destructive"
      });
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Print (Ctrl+P, Cmd+P) and Save (Ctrl+S, Cmd+S)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
        e.preventDefault();
        toast({
          title: "Action Blocked",
          description: "Printing and saving are disabled.",
          variant: "destructive"
        });
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toast]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const changePage = (offset: number) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= (numPages || 1)) {
      setPageNumber(newPage);
      localStorage.setItem(`pdf_progress_${productId}`, newPage.toString());
      onProgressUpdate?.(newPage);
    }
  };

  // Render Watermark dynamically over the canvas
  const drawWatermark = () => {
    const canvasElements = document.querySelectorAll('.react-pdf__Page__canvas');
    if (canvasElements.length === 0 || !user) return;

    canvasElements.forEach((canvas) => {
      const ctx = (canvas as HTMLCanvasElement).getContext('2d');
      if (!ctx) return;

      const text = `${user.username} | ${user.id} | ${new Date().toLocaleString()}`;
      
      // Draw diagonal watermark pattern
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.rotate(-Math.PI / 4);

      // Tile the watermark
      const canvasWidth = (canvas as HTMLCanvasElement).width;
      const canvasHeight = (canvas as HTMLCanvasElement).height;
      
      for (let x = -canvasHeight; x < canvasWidth * 2; x += 300) {
        for (let y = -canvasWidth; y < canvasHeight * 2; y += 150) {
          ctx.fillText(text, x, y);
        }
      }
      ctx.restore();
    });
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex flex-col items-center justify-center bg-zinc-950 text-white select-none",
        isFullscreen ? "h-screen w-screen p-4" : "h-[800px] w-full rounded-xl overflow-hidden border border-zinc-800"
      )}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between w-full p-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium w-16 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white">
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => changePage(-1)} 
            disabled={pageNumber <= 1}
            className="hover:bg-zinc-800 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-medium">
            Page {pageNumber} of {numPages || '--'}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => changePage(1)} 
            disabled={pageNumber >= (numPages || 1)}
            className="hover:bg-zinc-800 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="hover:bg-zinc-800 hover:text-white">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Reader Area */}
      <div className="flex-1 w-full overflow-auto flex justify-center bg-zinc-950 p-8">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="animate-pulse text-zinc-500">Loading secure document...</div>}
          error={<div className="text-red-500">Failed to load document securely.</div>}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            renderTextLayer={false} 
            renderAnnotationLayer={false}
            onRenderSuccess={drawWatermark}
            className="shadow-2xl ring-1 ring-zinc-800"
          />
        </Document>
      </div>
    </div>
  );
}
