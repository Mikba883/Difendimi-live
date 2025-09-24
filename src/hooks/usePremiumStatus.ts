import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PremiumStatus {
  isPremium: boolean;
  timeRemaining: string;
  trialEndsAt: Date | null;
  loading: boolean;
}

export function usePremiumStatus(): PremiumStatus {
  const [isPremium, setIsPremium] = useState(false);
  const [trialStartedAt, setTrialStartedAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("12:00:00");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  useEffect(() => {
    if (!trialStartedAt || isPremium) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const trialEnd = new Date(trialStartedAt.getTime() + 11 * 60 * 60 * 1000 + 43 * 60 * 1000); // 11 hours 43 minutes
      const diff = trialEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("00:00:00");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [trialStartedAt, isPremium]);

  const checkPremiumStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setIsPremium((profile as any).is_premium || false);
        // Use the trial_started_at from the database, never overwrite with new Date()
        if ((profile as any).trial_started_at) {
          setTrialStartedAt(new Date((profile as any).trial_started_at));
        } else {
          // If no trial_started_at in DB, it means the user just started their trial
          // You could optionally save this to the database here
          setTrialStartedAt(new Date());
        }
      }
    } catch (error) {
      console.error("Error checking premium status:", error);
    } finally {
      setLoading(false);
    }
  };

  const trialEndsAt = trialStartedAt
    ? new Date(trialStartedAt.getTime() + 11 * 60 * 60 * 1000 + 43 * 60 * 1000)
    : null;

  return {
    isPremium,
    timeRemaining,
    trialEndsAt,
    loading,
  };
}