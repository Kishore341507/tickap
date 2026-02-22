"use client";

import { useEffect } from "react";

interface EventHistoryTrackerProps {
  eventId: string;
}

const MAX_RECENT_EVENTS = 5;

/**
 * This component tracks the event being viewed and stores it in localStorage
 * so it can be displayed in the "Recently Opened" section of the sidebar.
 * Maintains a list of up to 5 most recently opened events.
 */
export default function EventHistoryTracker({ eventId }: EventHistoryTrackerProps) {
  useEffect(() => {
    try {
      // Get existing recent events
      const recentEventsJson = localStorage.getItem("recentEventIds");
      let recentEvents: string[] = recentEventsJson ? JSON.parse(recentEventsJson) : [];
      
      // Remove the current event if it already exists in the array
      recentEvents = recentEvents.filter(id => id !== eventId);
      
      // Add current event to the beginning
      recentEvents.unshift(eventId);
      
      // Keep only the most recent MAX_RECENT_EVENTS
      recentEvents = recentEvents.slice(0, MAX_RECENT_EVENTS);
      
      // Store updated array
      localStorage.setItem("recentEventIds", JSON.stringify(recentEvents));
    } catch (error) {
      console.error("Error storing recent event:", error);
    }
  }, [eventId]);

  // This component doesn't render anything
  return null;
}
