/**
 * Canvas LMS API helper.
 * Validates a personal access token and fetches user data.
 */

export interface CanvasUser {
  id: number;
  name: string;
  primary_email?: string;
  avatar_url?: string;
}

export interface CanvasValidationResult {
  valid: boolean;
  user?: CanvasUser;
  error?: string;
}

/**
 * Normalize a Canvas URL to a consistent base URL.
 * Accepts formats like:
 *   "myschool.instructure.com"
 *   "https://myschool.instructure.com"
 *   "https://myschool.instructure.com/"
 */
export function normalizeCanvasUrl(input: string): string {
  let url = input.trim();
  if (!url) return '';

  // Add https if no protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Remove trailing slash
  url = url.replace(/\/+$/, '');

  return url;
}

/**
 * Validate a Canvas personal access token by calling GET /api/v1/users/self
 */
export async function validateCanvasToken(
  baseUrl: string,
  token: string
): Promise<CanvasValidationResult> {
  try {
    const response = await fetch(`${baseUrl}/api/v1/users/self`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: 'Invalid token. Please check and try again.' };
    }

    if (!response.ok) {
      return { valid: false, error: `Canvas returned status ${response.status}` };
    }

    const user: CanvasUser = await response.json();

    if (!user.id) {
      return { valid: false, error: 'Unexpected response from Canvas.' };
    }

    return { valid: true, user };
  } catch (e: any) {
    if (e.message?.includes('Network request failed')) {
      return {
        valid: false,
        error: 'Could not connect to Canvas. Check your Canvas URL and network connection.',
      };
    }
    return { valid: false, error: e.message ?? 'Connection failed.' };
  }
}
