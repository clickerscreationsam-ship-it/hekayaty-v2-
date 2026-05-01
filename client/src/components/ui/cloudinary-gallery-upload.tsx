import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CloudinaryGalleryUploadProps {
    onUpload: (urls: string[]) => void;
    defaultImages?: string[];
    className?: string;
    folder?: string;
    label?: string;
    maxImages?: number;
}

export function CloudinaryGalleryUpload({
    onUpload,
    defaultImages = [],
    className = "",
    folder = "hekayaty_merch",
    label = "Product Gallery",
    maxImages = 10
}: CloudinaryGalleryUploadProps) {
    const [images, setImages] = useState<string[]>(defaultImages);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (images.length + files.length > maxImages) {
            toast({
                title: "Limit exceeded",
                description: `You can only upload up to ${maxImages} images.`,
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        const newUrls: string[] = [...images];

        try {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "hekayaty_preset";

            if (!cloudName) throw new Error("Missing Cloudinary Cloud Name");

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (!file.type.startsWith("image/")) continue;
                if (file.size > 5 * 1024 * 1024) continue;

                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", uploadPreset);
                formData.append("folder", folder);

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    { method: "POST", body: formData }
                );

                const data = await response.json();
                if (data.secure_url) {
                    newUrls.push(data.secure_url);
                }
            }

            setImages(newUrls);
            onUpload(newUrls);
            toast({
                title: "Upload Successful",
                description: "Gallery updated successfully.",
            });
        } catch (error: any) {
            console.error("Cloudinary gallery upload error:", error);
            toast({
                title: "Upload Failed",
                description: error.message || "Something went wrong.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onUpload(newImages);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {label && (
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">{label}</label>
                    <span className="text-xs text-muted-foreground">{images.length}/{maxImages}</span>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((url, index) => (
                    <div key={url + index} className="relative aspect-square rounded-xl overflow-hidden border border-border group bg-muted/20">
                        <img
                            src={url}
                            alt={`Gallery ${index}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleRemove(index)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {images.length < maxImages && (
                    <div className="relative aspect-square border-2 border-dashed border-muted-foreground/25 rounded-xl hover:bg-muted/50 transition-all flex flex-col items-center justify-center p-4 cursor-pointer group">
                        {loading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        ) : (
                            <>
                                <Plus className="w-8 h-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] text-muted-foreground text-center font-medium">Add Photo</span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </>
                        )}
                    </div>
                )}
            </div>

            {images.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-8 bg-muted/10 rounded-xl border border-dashed border-border">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No photos added yet. Show your customers different angles of your product.</p>
                </div>
            )}
        </div>
    );
}
