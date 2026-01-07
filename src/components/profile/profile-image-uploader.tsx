'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadProfileImage } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import 'react-image-crop/dist/ReactCrop.css';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';

interface ProfileImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (newUrl: string) => void;
}

const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;

export default function ProfileImageUploader({ isOpen, onClose, onUploadComplete }: ProfileImageUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const imageUrl = reader.result?.toString() || '';
      setImgSrc(imageUrl);
    });
    reader.readAsDataURL(file);
  };
  
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
     if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        toast({
            title: "Rasm o'lchami juda kichik",
            description: `Iltimos, o'lchami kamida ${MIN_DIMENSION}x${MIN_DIMENSION} bo'lgan rasm tanlang.`,
            variant: "destructive"
        })
        setImgSrc("");
        return;
    }

    const crop = makeAspectCrop(
        {
            unit: '%',
            width: 90,
        },
        ASPECT_RATIO,
        width,
        height
    );
    const centeredCrop = centerCrop(crop, width, height);
    setCrop(centeredCrop);
  }

  const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<Blob | null> => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            return Promise.resolve(null);
        }

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );
        
        return new Promise((resolve) => {
            canvas.toBlob(blob => {
                resolve(blob);
            }, 'image/jpeg', 0.9);
        });
    }

  const handleUpload = async () => {
    if (!user || !crop || !imgRef.current) return;
    
    setIsUploading(true);
    try {
        const croppedImageBlob = await getCroppedImg(imgRef.current, crop);
        if (!croppedImageBlob) {
            throw new Error("Rasm kesishda xatolik yuz berdi.");
        }

      const newUrl = await uploadProfileImage(user.id, croppedImageBlob);
      onUploadComplete(newUrl);
      toast({
        title: 'Rasm yangilandi!',
        description: 'Sizning yangi profilingiz rasmi muvaffaqiyatli saqlandi.',
      });
      handleClose();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Xatolik',
        description: 'Rasmni yuklashda xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setImgSrc('');
    setCrop(undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profil Rasmini Yuklash</DialogTitle>
          <DialogDescription>
            Yangi rasm tanlang va uni profilingizga moslab kesing.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {imgSrc ? (
             <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                aspect={ASPECT_RATIO}
                minWidth={MIN_DIMENSION}
            >
                <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} style={{maxHeight: '70vh'}} alt="Crop preview"/>
            </ReactCrop>
          ) : (
            <Input type="file" accept="image/*" onChange={onSelectFile} />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Bekor qilish
          </Button>
          <Button onClick={handleUpload} disabled={!imgSrc || !crop || isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isUploading ? 'Yuklanmoqda...' : 'Saqlash'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
