import React from 'react';

/**
 * Highlights a specific evidence token on the screen by scrolling to it (text)
 * or triggering an overlay (via state in ResultsView).
 * 
 * This helper focuses on DOM interactions for text items.
 */
export const highlightEvidenceToken = (tokenId: string) => {
  // For text items, we assume they are rendered with an ID 'evidence-{tokenId}'
  const el = document.getElementById(`evidence-${tokenId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add a flash effect via CSS class or inline style
    const originalBg = el.style.backgroundColor;
    el.style.backgroundColor = '#fef08a'; // yellow-200
    el.style.transition = 'background-color 0.5s ease';
    
    setTimeout(() => {
      el.style.backgroundColor = originalBg;
    }, 2000);
  }
};

/**
 * BBox styles helper
 */
export const getBBoxStyle = (tokenId: string, activeTokenId: string | null, meta?: any) => {
    if (!meta || !meta.bbox) return { display: 'none' };
    
    // Expect bbox [x, y, w, h] in 1000x1000 coordinate space
    const [x, y, w, h] = meta.bbox;
    const isActive = activeTokenId === tokenId;
    
    return {
         left: `${x / 10}%`,
         top: `${y / 10}%`,
         width: `${w / 10}%`,
         height: `${h / 10}%`,
         opacity: isActive ? 1 : 0,
         pointerEvents: 'none' as const, // ensure clicks pass through
         border: '2px solid #ef4444',
         backgroundColor: 'rgba(239, 68, 68, 0.2)',
         transition: 'opacity 0.3s ease-in-out',
         position: 'absolute' as const
    };
};

// No default component export needed as this is a utility module for the view
