import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Format a number as USD currency. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/** Format an ISO timestamp as a readable date, e.g. "Mar 14, 2025". */
export function formatDate(
  date: string | Date,
  timeZone?: string
): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(new Date(date))
}

/** Format an ISO timestamp as a readable time, e.g. "10:00 AM". */
export function formatTime(date: string | Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(date))
}

/** Format an ISO timestamp as date + time. */
export function formatDateTime(date: string | Date, timeZone?: string): string {
  return `${formatDate(date, timeZone)} · ${formatTime(date, timeZone)}`
}

/** Convert a string into a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Capitalize the first letter of a string. */
export function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Human-readable label for a booking status. */
export function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((part) => capitalize(part))
    .join(' ')
}
