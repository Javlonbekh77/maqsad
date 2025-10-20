'use client';

import { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { User } from '@/lib/types';
import { uploadAvatar } from '@/lib/data';
import { Camera, Save, X, RotateCw } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

interface AvatarUploadProps {
    user: User;
    onUploadComplete: () => void;
}

// Function to get the cropped image as a blob
async function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop,
  fileName: string
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const pixelRatio = window.devicePixelRatio;
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.95
    );
  });
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function AvatarUpload({ user, onUploadComplete }: AvatarUploadProps) {
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    const [isCropping, setIsCropping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Reset crop on new image
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
            setIsCropping(true);
        }
    };
    
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, 1));
    }

    const handleSaveCrop = useCallback(async () => {
      if (!completedCrop || !imgRef.current) {
        return;
      }
      setIsUploading(true);
      try {
        const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop, "avatar.jpg");
        if (!croppedImageBlob) {
            throw new Error("Could not crop image.");
        }

        await uploadAvatar(user.id, croppedImageBlob);
        
        toast({
          title: "Rasm Yangilandi",
          description: "Sizning yangi profilingiz rasmi muvaffaqiyatli saqlandi.",
        });

      } catch (error) {
        console.error("Failed to upload avatar", error);
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Rasmni yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
        });
      } finally {
        // This is the new, more robust logic.
        // First, reset all local states to close dialogs and loading indicators.
        setIsUploading(false);
        setIsCropping(false);
        setImgSrc('');
        // THEN, trigger the parent component to refresh its data.
        onUploadComplete();
      }
    }, [completedCrop, user.id, onUploadComplete, toast]);

    return (
        <div className="flex items-center gap-6">
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={onFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
            />
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <Avatar className="w-24 h-24 border-4 border-background ring-4 ring-primary/50">
                    <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    <AvatarFallback className="text-4xl">{user.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                </div>
            </div>
            <div>
                 <Button onClick={handleAvatarClick} variant="outline" disabled={isUploading}>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Rasmni o'zgartirish
                </Button>
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG, yoki WEBP. 5MB dan oshmasin.</p>
            </div>

            {isCropping && (
                <Dialog open={isCropping} onOpenChange={(open) => { if(!open) setIsCropping(false) }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Rasmni Kesish</DialogTitle>
                        </DialogHeader>
                        {imgSrc && (
                            <div className="my-4">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1}
                                    circularCrop
                                >
                                    <img
                                        ref={imgRef}
                                        alt="Crop me"
                                        src={imgSrc}
                                        onLoad={onImageLoad}
                                        className="max-h-[60vh]"
                                    />
                                </ReactCrop>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCropping(false)} disabled={isUploading}>
                                <X className="mr-2 h-4 w-4" />
                                Bekor qilish
                            </Button>
                            <Button onClick={handleSaveCrop} disabled={isUploading}>
                                {isUploading ? 'Saqlanmoqda...' : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Saqlash
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
