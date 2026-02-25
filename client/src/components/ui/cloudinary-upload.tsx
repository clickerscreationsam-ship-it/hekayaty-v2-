import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Music, Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CloudinaryUploadProps {
    onUpload: (url: string) => void;
    defaultImage?: string;
    className?: string;
    folder?: string;
    label?: string;
    aspectRatio?: "square" | "banner" | "video";
    resourceType?: "image" | "video" | "raw" | "auto";
}

export function CloudinaryUpload({
    onUpload,
    defaultImage,
    className = "",
    folder = "hekayaty_store",
    label = "Upload Image",
    aspectRatio = "square",
    resourceType = "image"
}: CloudinaryUploadProps) {
    const [image, setImage] = useState<string | null>(defaultImage || null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (resourceType === "image" && !file.type.startsWith("image/")) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image file (PNG, JPG, WEBP).",
                variant: "destructive",
            });
            return;
        }

        if ((resourceType === "video" || resourceType === "auto") && !file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
            // If it's for audio, we allow audio types
            if (!file.type.startsWith("audio/")) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload an audio file (MP3, WAV).",
                    variant: "destructive",
                });
                return;
            }
        }

        // Validate file size
        // For audio/video we allow more (e.g. 100MB), for images 10MB
        const maxSize = (resourceType === "image") ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
        if (file.size > maxSize) {
            toast({
                title: "File too large",
                description: `File size should be less than ${maxSize / (1024 * 1024)}MB.`,
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "hekayaty_preset");
        formData.append("folder", folder);
        if (resourceType !== "auto") {
            formData.append("resource_type", resourceType);
        }

        try {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) {
                throw new Error("Missing Cloudinary Cloud Name");
            }

            // Cloudinary requires resource_type in the URL or formData for some APIs
            // Using 'auto' is usually safest for the base upload API if we don't know
            const uploadType = resourceType === "auto" ? "auto" : resourceType;
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/${uploadType}/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (data.secure_url) {
                setImage(data.secure_url);
                onUpload(data.secure_url);
                toast({
                    title: "Upload Successful",
                    description: "Your image has been uploaded successfully.",
                });
            } else {
                throw new Error(data.error?.message || "Upload failed");
            }
        } catch (error: any) {
            console.error("Cloudinary upload error:", error);
            toast({
                title: "Upload Failed",
                description: error.message || "Something went wrong while uploading.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        setImage(null);
        onUpload("");
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {label && <label className="text-sm font-medium">{label}</label>}

            {image ? (
                <div className={`relative rounded-lg overflow-hidden border-2 border-border group ${aspectRatio === 'banner' ? 'aspect-[3/1]' :
                    aspectRatio === 'video' ? 'aspect-video w-full' :
                        'aspect-square w-32'
                    }`}>
                    {resourceType === "image" ? (
                        <img
                            src={image}
                            alt="Uploaded preview"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-primary/10 flex flex-col items-center justify-center p-2">
                            <Music className="w-8 h-8 text-primary mb-1" />
                            <span className="text-[8px] text-center truncate w-full opacity-60">Audio File Attached</span>
                            {/* Optional: Add a simple audio player here for verification */}
                            <audio src={image} className="w-full h-4 mt-1" controls />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 z-20">
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-lg"
                            onClick={handleRemove}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className={`relative border-2 border-dashed border-muted-foreground/25 rounded-lg hover:bg-muted/50 transition-colors flex flex-col items-center justify-center p-6 ${aspectRatio === 'banner' ? 'aspect-[3/1]' :
                    aspectRatio === 'video' ? 'aspect-video w-full' :
                        'aspect-square w-32'
                    }`}>
                    {loading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    ) : (
                        <>
                            {resourceType === "image" ? (
                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            ) : (
                                <Music className="w-8 h-8 text-muted-foreground mb-2" />
                            )}
                            <span className="text-xs text-muted-foreground text-center">
                                {resourceType === "image"
                                    ? (aspectRatio === 'banner' ? 'Upload Banner' : 'Upload Icon')
                                    : 'Upload Audio'}
                            </span>
                            <input
                                type="file"
                                accept={resourceType === "image" ? "image/*" : "audio/*"}
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
