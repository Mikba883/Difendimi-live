import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    dataLayer: any[];
  }
}

type EventData = {
  event_source_url?: string;
  custom_data?: Record<string, any>;
  test_event_code?: string;
};

type UserData = {
  email?: string;
  phone?: string;
  fn?: string; // First name
  ln?: string; // Last name
  external_id?: string; // User ID
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string; // Facebook Click ID
  fbp?: string; // Facebook Browser ID
};

export function useMetaPixel() {
  const location = useLocation();

  // Initialize dataLayer if it doesn't exist
  useEffect(() => {
    if (!window.dataLayer) {
      window.dataLayer = [];
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackEvent('PageView', {
      event_source_url: window.location.href,
    });
  }, [location]);

  const trackEvent = async (
    eventName: string,
    eventData: EventData = {},
    userData: UserData = {}
  ) => {
    try {
      // Send event to GTM/Client-side
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'meta_pixel_event',
          event_name: eventName,
          event_data: eventData,
          user_data: userData,
        });
      }

      // Send event to Conversions API (server-side)
      const { data: sessionData } = await supabase.auth.getSession();
      const enhancedUserData: UserData = {
        ...userData,
        external_id: sessionData?.session?.user?.id,
        client_user_agent: navigator.userAgent,
        // Get Facebook cookies if available
        fbc: getCookie('_fbc'),
        fbp: getCookie('_fbp'),
      };

      // Add user email if logged in and not already provided
      if (sessionData?.session?.user?.email && !enhancedUserData.email) {
        enhancedUserData.email = sessionData.session.user.email;
      }

      const response = await supabase.functions.invoke('meta-pixel-api', {
        body: {
          eventName,
          eventData: {
            ...eventData,
            event_source_url: eventData.event_source_url || window.location.href,
          },
          userData: enhancedUserData,
        },
      });

      if (response.error) {
        console.error('Meta Pixel API error:', response.error);
      }
    } catch (error) {
      console.error('Error tracking Meta Pixel event:', error);
    }
  };

  return { trackEvent };
}

// Helper function to get cookie value
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}