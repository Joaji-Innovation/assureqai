"use client";

import { useState, useEffect } from "react";

interface LocationData {
  country: string;
  countryCode: string;
  isIndia: boolean;
}

interface PricingData {
  aiAuditPrice: string;
  manualAuditPrice: string;
  currency: string;
  currencySymbol: string;
}

export function useLocationPricing(): {
  pricing: PricingData;
  isLoading: boolean;
  error: string | null;
} {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Use ipapi.co for free IP geolocation
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();

        if (data.error) {
          throw new Error(data.reason || "Failed to detect location");
        }

        const locationData: LocationData = {
          country: data.country_name,
          countryCode: data.country_code,
          isIndia: data.country_code === "IN",
        };

        setLocation(locationData);
      } catch (err) {
        console.error("Location detection failed:", err);
        // Fallback to default (non-India) pricing
        setLocation({
          country: "Unknown",
          countryCode: "XX",
          isIndia: false,
        });
        setError("Failed to detect location, using default pricing");
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, []);

  const pricing: PricingData = location?.isIndia
    ? {
        aiAuditPrice: "2",
        manualAuditPrice: "0.2",
        currency: "INR",
        currencySymbol: "₹",
      }
    : {
        aiAuditPrice: "0.05",
        manualAuditPrice: "0.02",
        currency: "USD",
        currencySymbol: "$",
      };

  return { pricing, isLoading, error };
}
