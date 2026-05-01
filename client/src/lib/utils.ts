import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date))
}

export function optimizeImage(url: string, width?: number, height?: number) {
  if (!url || !url.includes("cloudinary.com")) return url;

  // Split by /upload/ to inject transformation parameters
  const parts = url.split("/upload/");
  if (parts.length !== 2) return url;

  const transformations = ["f_auto", "q_auto"];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  // Add c_limit by default for width/height to avoid upscaling
  if (width || height) transformations.push("c_limit");

  return `${parts[0]}/upload/${transformations.join(",")}/${parts[1]}`;
}
