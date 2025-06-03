// Base64 encoding/decoding utilities
// Based on the approach from progers/base64

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encodeBase64(input: string): string {
  try {
    // Use built-in btoa for modern browsers
    return btoa(input);
  } catch (error) {
    // Fallback implementation
    let result = '';
    let i = 0;
    
    while (i < input.length) {
      const a = input.charCodeAt(i++);
      const b = i < input.length ? input.charCodeAt(i++) : 0;
      const c = i < input.length ? input.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < input.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < input.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  }
}

export function decodeBase64(input: string): string {
  try {
    // Use built-in atob for modern browsers
    return atob(input);
  } catch (error) {
    throw new Error('Invalid Base64 string');
  }
}

export function isBase64(str: string): boolean {
  try {
    // Check if string matches Base64 pattern
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) {
      return false;
    }
    
    // Try to decode and see if it works
    decodeBase64(str);
    return true;
  } catch {
    return false;
  }
} 