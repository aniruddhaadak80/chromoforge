import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tail-aware class combiner used across the app. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
