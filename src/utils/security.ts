/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitize HTML content (removes dangerous tags)
 */
export function sanitizeHTML(html: string): string {
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'];
  const div = document.createElement('div');
  div.innerHTML = html;

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) return;
    
    const nodesToRemove: Node[] = [];
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        
        if (!allowedTags.includes(element.tagName.toLowerCase())) {
          nodesToRemove.push(child);
        } else {
          // Remove dangerous attributes
          Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
              element.removeAttribute(attr.name);
            }
          });
          walk(child);
        }
      } else if (child.nodeType !== Node.TEXT_NODE) {
        nodesToRemove.push(child);
      }
    }
    
    nodesToRemove.forEach(node => node.parentNode?.removeChild(node));
  };

  walk(div);
  return div.innerHTML;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Au moins 8 caractères');

  if (password.length >= 12) score++;
  else feedback.push('Idéalement 12 caractères ou plus');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Contient des lettres minuscules');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Contient des lettres majuscules');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Contient des chiffres');

  if (/[!@#$%^&*]/.test(password)) score++;
  else feedback.push('Contient des caractères spéciaux');

  return {
    isStrong: score >= 4,
    score,
    feedback,
  };
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get CSRF token from storage or generate new one
 */
export function getCSRFToken(): string {
  let token = localStorage.getItem('csrf_token');
  if (!token) {
    token = generateCSRFToken();
    localStorage.setItem('csrf_token', token);
  }
  return token;
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string): boolean {
  const storedToken = localStorage.getItem('csrf_token');
  return storedToken === token;
}
