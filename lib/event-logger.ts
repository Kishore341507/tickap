import { EventLogType, EventLogTarget } from "@prisma/client";
import { auth } from "@/auth";
import prisma from "@/prisma/db";

export async function createEventLog({
  event_id,
  log_type,
  log_target,
  old_data = null,
  new_data = null,
  registration_id = null,
}: {
  event_id: bigint | number;
  log_type: EventLogType;
  log_target: EventLogTarget;
  old_data?: any | null;
  new_data?: any | null;
  registration_id?: bigint | number | null;
}) {
  try {

    const session = await auth() ; 
    if (!session) {
        return null;
    }

    const eventId = typeof event_id === "number" ? BigInt(event_id) : event_id;
    let userId = BigInt(session.user.userId ?? 0);
    
    let regId = registration_id;
    if (regId && typeof regId === "number") {
      regId = BigInt(regId);
    }
    const userName = session.user.name ?? null;

    // Create the log entry
    const log = await prisma.eventLog.create({
      data: {
        event_id: eventId,
        user_id: userId,
        user_name: userName,
        log_type,
        log_target,
        old_data,
        new_data,
        registration_id: regId,
      },
    });

    return log;
  } catch (error) {
    console.error("Error creating event log:", error);
    throw error;
  }
}