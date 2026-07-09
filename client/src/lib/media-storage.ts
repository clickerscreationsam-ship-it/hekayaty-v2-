interface CloudinaryAccount {
  cloudName: string;
  uploadPreset: string;
}

// Order matters: We try accounts in order. We can put the primary first, then fallback.
const CLOUDINARY_ACCOUNTS: CloudinaryAccount[] = [];

const primaryCloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const primaryPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "hekayaty_preset";
if (primaryCloud) {
  CLOUDINARY_ACCOUNTS.push({ cloudName: primaryCloud, uploadPreset: primaryPreset });
}

const fallbackCloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME_2;
const fallbackPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_2;
if (fallbackCloud && fallbackPreset) {
  CLOUDINARY_ACCOUNTS.push({ cloudName: fallbackCloud, uploadPreset: fallbackPreset });
}

export async function uploadMedia(file: File, folder: string = "hekayaty_store", resourceType: string = "image"): Promise<string> {
    if (CLOUDINARY_ACCOUNTS.length === 0) {
        throw new Error("No Cloudinary accounts configured in environment variables.");
    }

    const uploadType = resourceType === "auto" ? "auto" : resourceType;
    let lastError: any = null;

    for (let i = 0; i < CLOUDINARY_ACCOUNTS.length; i++) {
        const account = CLOUDINARY_ACCOUNTS[i];
        
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", account.uploadPreset);
            formData.append("folder", folder);

            // Note: the URL determines the type, but sending resource_type in formData is sometimes needed for 'auto'
            if (resourceType !== "auto") {
                formData.append("resource_type", resourceType);
            }

            console.log(`[MediaStorage] Attempting upload to Cloudinary account: ${account.cloudName}`);
            
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${account.cloudName}/${uploadType}/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (data.secure_url) {
                if (i > 0) {
                    console.info(`[MediaStorage] Successfully failed over and uploaded to fallback account ${account.cloudName}`);
                }
                return data.secure_url;
            } else {
                throw new Error(data.error?.message || "Upload failed");
            }
        } catch (error: any) {
            console.warn(`[MediaStorage] Upload failed for account ${account.cloudName}:`, error.message);
            lastError = error;
            // Continue to the next account in the loop to failover
        }
    }

    throw new Error(`All configured upload accounts failed. Last error: ${lastError?.message || "Unknown error"}`);
}
