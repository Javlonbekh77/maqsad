import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
    if (!name) return "";
    const nameParts = name.trim().split(' ');
    if (nameParts.length > 1 && nameParts[nameParts.length - 1]) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export const avatarColors = [
    { name: 'red', color: '#f87171' }, 
    { name: 'orange', color: '#fb923c' }, 
    { name: 'amber', color: '#fbbf24' },
    { name: 'lime', color: '#a3e635' }, 
    { name: 'green', color: '#4ade80' },
    { name: 'emerald', color: '#34d399' },
    { name: 'teal', color: '#2dd4bf' },
    { name: 'blue', color: '#60a5fa' },
    { name: 'indigo', color: '#818cf8' },
    { name: 'purple', color: '#c084fc' },
    { name: 'pink', color: '#f472b6' },
];

function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

export function getAvatarColor(userId: string): string {
    if (!userId) {
        return avatarColors[0].color;
    }
    const hash = simpleHash(userId);
    return avatarColors[hash % avatarColors.length].color;
}
