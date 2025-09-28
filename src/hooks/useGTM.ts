import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer: any[];
    fbq: (type: string, eventName: string, params?: any) => void;
  }
}

// Standard Meta Pixel events
const STANDARD_EVENTS = [
  'PageView',
  'ViewContent',
  'Search',
  'AddToCart',
  'AddToWishlist',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'Lead',
  'CompleteRegistration',
  'Contact',
  'CustomizeProduct',
  'Donate',
  'FindLocation',
  'Schedule',
  'StartTrial',
  'SubmitApplication',
  'Subscribe'
];

export function useGTM() {
  const location = useLocation();

  // Initialize dataLayer if it doesn't exist
  useEffect(() => {
    if (!window.dataLayer) {
      window.dataLayer = [];
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'page_view',
        page_path: location.pathname,
        page_title: document.title,
      });
    }
  }, [location]);

  const trackEvent = (eventName: string, eventData?: any) => {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...eventData,
      });
    }

    // If fbq is available, send to Meta Pixel with correct method
    if (window.fbq) {
      // Use 'track' for standard events, 'trackCustom' for custom events
      const isStandardEvent = STANDARD_EVENTS.includes(eventName);
      const pixelMethod = isStandardEvent ? 'track' : 'trackCustom';
      
      window.fbq(pixelMethod, eventName, eventData);
    }
  };

  return { trackEvent };
}