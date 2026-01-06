"use client";

import { useEffect } from "react";

interface EventHistoryTrackerProps {
  eventId: string;
}

/**
 * This component tracks the event being viewed and stores it in localStorage
 * so it can be displayed in the "Recently Opened" section of the sidebar.
 */
export default function EventHistoryTracker({ eventId }: EventHistoryTrackerProps) {
  useEffect(() => {
    // Store the current event ID in localStorage as the most recently opened event
    try {
      localStorage.setItem("recentEventId", eventId);
    } catch (error) {
      console.error("Error storing recent event:", error);
    }
  }, [eventId]);

  // This component doesn't render anything
  return null;
}
