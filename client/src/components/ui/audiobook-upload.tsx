import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Music, Loader2, Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudiobookUploadProps {
    onUpload: (data: { parts: { url: string; title: string; duration: number }[]; totalDuration: number }) => void;
    onClear: () => void;
    label?: string;
}

export function AudiobookUpload({
    onUpload,
    onClear,
    label = "Upload Audiobook (Full File)"
}: AudiobookUploadProps) {
    const [loading, setLoading] = useState(false);
    const [complete, setComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("audio/")) {
            toast({
                title: "Invalid file type",
                description: "Please upload an audio file (MP3, WAV).",
                variant: "destructive",
            });
            return;
        }

        // Validate file size (100MB max)
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            toast({
                title: "File too large",
                description: `File size should be less than 100MB.`,
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setError(null);
        setFileName(file.name);

        const formData = new FormData();
        formData.append("audio", file);

        try {
            const response = await fetch("/api/audio/process", {
                method: "POST",
                body: formData,
                // Authentication should be handled by the session cookie automatically
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to process audio");
            }

            const data = await response.json();

            onUpload(data);
            setComplete(true);
            toast({
                title: "Processing Complete",
                description: `Audio split into ${data.parts.length} chapters successfully.`,
            });
        } catch (error: any) {
            console.error("Audiobook process error:", error);
            setError(error.message || "Failed to process audiobook.");
            toast({
                title: "Upload Failed",
                description: error.message || "Something went wrong while processing.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setComplete(false);
        setFileName(null);
        setError(null);
        onClear();
    };

    return (
        <div className="space-y-4">
            {label && <label className="text-sm font-medium">{label}</label>}

            <div className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${loading ? 'border-primary/50 bg-primary/5' :
                    complete ? 'border-green-500/50 bg-green-500/5' :
                        error ? 'border-destructive/50 bg-destructive/5' :
                            'border-muted-foreground/25 hover:bg-muted/50'
                }`}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <div className="text-sm text-center">
                            <p className="font-bold text-primary">Splitting & Uploading...</p>
                            <p className="text-muted-foreground text-xs mt-1 italic">This may take a minute for large files</p>
                        </div>
                    </div>
                ) : complete ? (
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                        <div className="text-sm text-center">
                            <p className="font-bold text-green-600">Verification Successful</p>
                            <p className="text-muted-foreground text-xs truncate max-w-[200px]">{fileName}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleClear} className="mt-2">
                            <X className="w-4 h-4 mr-2" /> Change File
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Music className="w-6 h-6" />
                        </div>
                        <div className="text-sm text-center">
                            <p className="font-bold">Click to Upload Master Audio</p>
                            <p className="text-muted-foreground text-xs">MP3, WAV up to 100MB</p>
                        </div>
                        <p className="text-[10px] text-primary/60 italic mt-2">Will be automatically split into 5-minute chapters</p>

                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                )}

                {error && !loading && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <p className="text-xs text-destructive font-medium">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
