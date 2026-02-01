import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CloudinaryUploadProps {
    onUpload: (url: string) => void;
    defaultImage?: string;
    className?: string;
    folder?: string;
    label?: string;
    aspectRatio?: "square" | "banner" | "video";
}

export function CloudinaryUpload({
    onUpload,
    defaultImage,
    className = "",
    folder = "hekayaty_store",
    label = "Upload Image",
    aspectRatio = "square"
}: CloudinaryUploadProps) {
    const [image, setImage] = useState<string | null>(defaultImage || null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image file (PNG, JPG, WEBP).",
                variant: "destructive",
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Image size should be less than 5MB.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "hekayaty_preset");
        formData.append("folder", folder);

        try {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) {
                throw new Error("Missing Cloudinary Cloud Name");
            }

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
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
                    <img
                        src={image}
                        alt="Uploaded preview"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full"
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
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground text-center">
                                {aspectRatio === 'banner' ? 'Upload Banner' : 'Upload Icon'}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
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
