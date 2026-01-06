/**
 * Extracts placeholder variables from a string or object that use the {{$.path}} format
 * and converts them to the path.$ format (suitable for parameter keys)
 * @param data - The data to extract placeholders from (can be string, object, array, etc.)
 * @returns Array of unique placeholders in path.$ format
 */
export function extractPlaceholders(data: any): string[] {
  const placeholders = new Set<string>();

  // Regex to match {{$.something}} patterns
  const placeholderRegex = /\{\{\$\.([^}]+)\}\}/g;

  function traverse(value: any) {
    if (typeof value === 'string') {
      // Find all matches in the string
      let match;
      const regex = new RegExp(placeholderRegex);
      while ((match = regex.exec(value)) !== null) {
        // Convert {{$.path}} to path.$
        const path = match[1]; // Get the part after $. and before }}
        const convertedPath = path.split('.').join('.') + '.$';
        placeholders.add(convertedPath);
      }
    } else if (Array.isArray(value)) {
      value.forEach((item) => traverse(item));
    } else if (value !== null && typeof value === 'object') {
      Object.values(value).forEach((item) => traverse(item));
    }
  }

  traverse(data);

  return Array.from(placeholders).sort();
}
