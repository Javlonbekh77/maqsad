import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
    if (!name) return "";
    const nameParts = name.trim().split(' ');
    if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

const avatarColors = [
    '#f87171', // red-400
    '#fb923c', // orange-400
    '#fbbf24', // amber-400
    '#a3e635', // lime-400
    '#4ade80', // green-400
    '#34d399', // emerald-400
    '#2dd4bf', // teal-400
    '#60a5fa', // blue-400
    '#818cf8', // indigo-400
    '#c084fc', // purple-400
    '#f472b6', // pink-400
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
        return avatarColors[0];
    }
    const hash = simpleHash(userId);
    return avatarColors[hash % avatarColors.length];
}
