import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { getMember } from "@/lib/discord";
import { checkIsManager } from "@/lib/discord";
import { createEventLog } from "@/lib/event-logger";
import { EventLogType , EventLogTarget } from "@prisma/client";

// Helper function to handle BigInt serialization
const serializeData = (data: any): any => {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    })
  );
};

// POST: Create a new registration as a manager
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const body = await request.json();
    const { teamName, teamMembers } = body;

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    // Check if user is a manager for this event's guild
    const event = await prisma.events.findUnique({
      where: { id: BigInt(id) },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (!event.guild_id) {
      return NextResponse.json(
        { message: "Event is not associated with a Discord server" },
        { status: 400 }
      );
    }

    const userId = session.user.userId!;
    const isManager = await checkIsManager(userId, event.guild_id.toString());

    if (!isManager) {
      return NextResponse.json(
        { message: "You do not have permission to manage this event" },
        { status: 403 }
      );
    }

    // Validate team name
    if (
      !teamName ||
      teamName.trim().length < 3 ||
      teamName.trim().length > 40
    ) {
      return NextResponse.json(
        { message: "Team name must be between 3 and 40 characters" },
        { status: 400 }
      );
    }

    // For team events, validate team size
    if (!event.is_solo) {
      if (
        event.min_team_player &&
        (!teamMembers || teamMembers.length < event.min_team_player)
      ) {
        return NextResponse.json(
          {
            message: `Team must have at least ${event.min_team_player} members (including owner)`,
          },
          { status: 400 }
        );
      }

      if (
        event.max_team_player &&
        teamMembers &&
        teamMembers.length > event.max_team_player
      ) {
        return NextResponse.json(
          {
            message: `Team cannot have more than ${event.max_team_player} members (including owner)`,
          },
          { status: 400 }
        );
      }
    } else {
      // only 1 team member for solo events
      if (teamMembers && teamMembers.length > 1) {
        return NextResponse.json(
          { message: "Solo events can only have one participant" },
          { status: 400 }
        );
      }
    }

    // Check if maximum participants limit is reached
    if (event.max_teams) {
      const registrationsCount = await prisma.registrations.count({
        where: { event_id: BigInt(id) },
      });

      if (registrationsCount >= Number(event.max_teams)) {
        return NextResponse.json(
          { message: "Event has reached maximum participants" },
          { status: 400 }
        );
      }
    }

    // For team events, process team members
    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json(
        { message: "Team members are required for team events" },
        { status: 400 }
      );
    }

    // Check if any team members are already registered
    const existingRegistrations = await prisma.registrationusers.findMany({
      where: {
        event_id: BigInt(id),
        user_id: {
          in: teamMembers.map((memberId: string) => BigInt(memberId)),
        },
      },
    });

    if (existingRegistrations.length > 0) {
      return NextResponse.json(
        {
          message:
            "One or more team members are already registered for this event",
        },
        { status: 400 }
      );
    }

    // Create team registration with all members
    const registration = await prisma.registrations.create({
      data: {
        event_id: BigInt(id),
        team_name: teamName,
      },
    });

    // Fetch Discord information for all team members and add them to the registration
    const teamMembersData = await Promise.all(
      teamMembers.map(async (memberId: string) => {
        const memberData = await getMember(
          event.guild_id!.toString(),
          memberId
        );

        // If member data couldn't be fetched, use basic information
        if (!memberData) {
          return {
            user_id: BigInt(memberId),
            user_name: null,
            pfp: null,
            event_id: BigInt(id),
            registration_id: registration.id,
          };
        }

        // Get user data from Discord response
        const user = memberData.user;
        const username = user.global_name || user.username;

        // Construct avatar URL
        let avatarUrl = null;
        if (user.avatar) {
          const format = user.avatar.startsWith("a_") ? "gif" : "png";
          avatarUrl = `https://cdn.discordapp.com/avatars/${memberId}/${user.avatar}.${format}`;
        }

        return {
          user_id: BigInt(memberId),
          user_name: username,
          pfp: avatarUrl,
          event_id: BigInt(id),
          registration_id: registration.id,
        };
      })
    );

    // Add all team members to the registration
    await prisma.registrationusers.createMany({
      data: teamMembersData,
    });

    // Return the complete registration with users
    const completeRegistration = await prisma.registrations.findUnique({
      where: { id: registration.id },
      include: {
        registrationusers: true,
      },
    });

    await createEventLog({
      event_id: BigInt(id),
      log_type: EventLogType.CREATE,
      log_target: EventLogTarget.REGISTRATION,
      old_data: null,
      new_data: {
        ...completeRegistration
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        registration: serializeData(completeRegistration),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Failed to register for event" },
      { status: 500 }
    );
  }
}

// PUT: Update registration (add/remove users)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const body = await request.json();
    const { user_id, action, registration_id } = body;

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    // Check if required fields are provided
    if (!user_id || !action) {
      return NextResponse.json(
        { message: "Missing required fields: user_id and action" },
        { status: 400 }
      );
    }

    // Check if user is a manager for this event's guild
    const event = await prisma.events.findUnique({
      where: { id: BigInt(id) },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (!event.guild_id) {
      return NextResponse.json(
        { message: "Event is not associated with a Discord server" },
        { status: 400 }
      );
    }

    const userId = session.user.userId!;
    const isManager = await checkIsManager(userId, event.guild_id.toString());

    if (!isManager) {
      return NextResponse.json(
        { message: "You do not have permission to manage this event" },
        { status: 403 }
      );
    }

    // Find the registration
    const registration = await prisma.registrations.findFirst({
      where: {
        id: registration_id ? BigInt(registration_id) : undefined,
        event_id: BigInt(id),
      },
      include: {
        registrationusers: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 }
      );
    }

    // Handle user addition or removal based on action
    if (action === "add") {
      // Check if event is solo (can't add members to solo registrations)
      if (event.is_solo) {
        return NextResponse.json(
          { message: "Cannot add members to solo event registrations" },
          { status: 400 }
        );
      }

      // Check if user is already registered for this event
      const existingUserRegistration = await prisma.registrationusers.findFirst(
        {
          where: {
            user_id: BigInt(user_id),
            event_id: BigInt(id),
          },
        }
      );

      if (existingUserRegistration) {
        return NextResponse.json(
          { message: "User is already registered for this event" },
          { status: 400 }
        );
      }

      // Check team size limit
      if (
        event.max_team_player &&
        registration.registrationusers.length >= Number(event.max_team_player)
      ) {
        return NextResponse.json(
          {
            message: `Team cannot have more than ${event.max_team_player} members`,
          },
          { status: 400 }
        );
      }

      // Fetch Discord information for the user
      const memberData = await getMember(event.guild_id.toString(), user_id);

      // Prepare user data
      let userData: any = {
        user_id: BigInt(user_id),
        user_name: null,
        pfp: null,
        event_id: BigInt(id),
        registration_id: registration.id,
      };

      // If we have Discord data, enhance the user information
      if (memberData) {
        const user = memberData.user;
        const username = user.global_name || user.username;

        let avatarUrl = null;
        if (user.avatar) {
          const format = user.avatar.startsWith("a_") ? "gif" : "png";
          avatarUrl = `https://cdn.discordapp.com/avatars/${user_id}/${user.avatar}.${format}`;
        }

        userData.user_name = username;
        userData.pfp = avatarUrl;
      }

      // Add the user to the team
      const newRegistrationUser = await prisma.registrationusers.create({
        data: userData,
      });

      // Get the updated registration
      const updatedRegistration = await prisma.registrations.findUnique({
        where: { id: registration.id },
        include: {
          registrationusers: true,
        },
      });

      await createEventLog({
        event_id: BigInt(id),
        log_type: EventLogType.UPDATE,
        log_target: EventLogTarget.REGISTRATION,
        old_data: {...registration},
        new_data: {
          ...updatedRegistration,
          new_user: newRegistrationUser,
        },
      });

      return NextResponse.json(
        {
          message: "User added to team successfully",
          registration: serializeData(updatedRegistration),
        },
        { status: 200 }
      );
    } else if (action === "remove") {
      // Check if user exists in the registration
      const userToRemove = registration.registrationusers.find(
        (ru) => ru.user_id.toString() === user_id
      );

      if (!userToRemove) {
        return NextResponse.json(
          { message: "User is not a member of this team" },
          { status: 404 }
        );
      }

      // Check if removing this user would violate the minimum team size requirement
      if (
        event.min_team_player &&
        registration.registrationusers.length <= Number(event.min_team_player)
      ) {
        // Delete the complete registration if removing would violate minimum team size
        await prisma.registrations.delete({
          where: {
            id: registration.id,
          },
        });

        await createEventLog({
          event_id: BigInt(id),
          log_type: EventLogType.DELETE,
          log_target: EventLogTarget.REGISTRATION,
          old_data: {...registration},
          new_data: null,
        });

        return NextResponse.json(
          {
            message:
              "Complete registration removed due to insufficient team members",
            registration: null,
          },
          { status: 200 }
        );
      }

      // Remove the user from the team
      await prisma.registrationusers.delete({
        where: {
          user_id_registration_id: {
            user_id: BigInt(user_id),
            registration_id: registration.id,
          },
        },
      });

      // Get the updated registration
      const updatedRegistration = await prisma.registrations.findUnique({
        where: { id: registration.id },
        include: {
          registrationusers: true,
        },
      });

      await createEventLog({
        event_id: BigInt(id),
        log_type: EventLogType.UPDATE,
        log_target: EventLogTarget.REGISTRATION,
        old_data: {...registration},
        new_data: {
          ...updatedRegistration,
          removed_user: userToRemove,
        },
      });

      return NextResponse.json(
        {
          message: "User removed from team successfully",
          registration: serializeData(updatedRegistration),
        },
        { status: 200 }
      );
    } else if (action === "replace") {
      const { replace_id } = body;

      // Check if replace_id is provided
      if (!replace_id) {
        return NextResponse.json(
          { message: "Missing required field: replace_id" },
          { status: 400 }
        );
      }

      // Check if user to be replaced exists in the registration
      const userToReplace = registration.registrationusers.find(
        (ru) => ru.user_id.toString() === replace_id
      );

      if (!userToReplace) {
        return NextResponse.json(
          { message: "User to be replaced is not a member of this team" },
          { status: 404 }
        );
      }

      // Check if new user is already registered for this event
      const existingUserRegistration = await prisma.registrationusers.findFirst(
        {
          where: {
            user_id: BigInt(user_id),
            event_id: BigInt(id),
          },
        }
      );

      if (existingUserRegistration) {
        return NextResponse.json(
          { message: "New user is already registered for this event" },
          { status: 400 }
        );
      }

      // Fetch Discord information for the new user
      const memberData = await getMember(event.guild_id.toString(), user_id);

      // Prepare user data for the new user
      let userData: any = {
        user_id: BigInt(user_id),
        user_name: null,
        pfp: null,
        event_id: BigInt(id),
        registration_id: registration.id,
      };

      // If we have Discord data, enhance the user information
      if (memberData) {
        const user = memberData.user;
        const username = user.global_name || user.username;

        let avatarUrl = null;
        if (user.avatar) {
          const format = user.avatar.startsWith("a_") ? "gif" : "png";
          avatarUrl = `https://cdn.discordapp.com/avatars/${user_id}/${user.avatar}.${format}`;
        }

        userData.user_name = username;
        userData.pfp = avatarUrl;
      }

      // Use a transaction to ensure atomicity when replacing users
      await prisma.$transaction([
        // Delete the user to be replaced
        prisma.registrationusers.delete({
          where: {
            user_id_registration_id: {
              user_id: BigInt(replace_id),
              registration_id: registration.id,
            },
          },
        }),

        // Add the new user
        prisma.registrationusers.create({
          data: userData,
        }),
      ]);

      // Get the updated registration
      const updatedRegistration = await prisma.registrations.findUnique({
        where: { id: registration.id },
        include: {
          registrationusers: true,
        },
      });

      await createEventLog({
        event_id: BigInt(id),
        log_type: EventLogType.UPDATE,
        log_target: EventLogTarget.REGISTRATION,
        old_data: {...registration},
        new_data: {
          ...updatedRegistration,
          replaced_user: userToReplace,
          new_user: userData,
        },
      });

      return NextResponse.json(
        {
          message: "User replaced successfully",
          registration: serializeData(updatedRegistration),
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Invalid action. Use 'add', 'remove', or 'replace'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Registration update error:", error);
    return NextResponse.json(
      { message: "Failed to update registration" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a registration as a manager
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const registration_id = searchParams.get("registration_id");

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    if (!registration_id) {
      return NextResponse.json(
        { message: "Missing required parameter: registration_id" },
        { status: 400 }
      );
    }

    // Check if user is a manager for this event's guild
    const event = await prisma.events.findUnique({
      where: { id: BigInt(id) },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (!event.guild_id) {
      return NextResponse.json(
        { message: "Event is not associated with a Discord server" },
        { status: 400 }
      );
    }

    const userId = session.user.userId!;
    const isManager = await checkIsManager(userId, event.guild_id.toString());

    if (!isManager) {
      return NextResponse.json(
        { message: "You do not have permission to manage this event" },
        { status: 403 }
      );
    }

    // Check if registration exists
    const registration = await prisma.registrations.findFirst({
      where: {
        id: BigInt(registration_id),
        event_id: BigInt(id),
      },
      include: {
        registrationusers: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 }
      );
    }

    // Delete the registration (cascading delete will remove associated registrationusers)
    await prisma.registrations.delete({
      where: {
        id: BigInt(registration_id),
      },
    });

    await createEventLog({
      event_id: BigInt(id),
      log_type: EventLogType.DELETE,
      log_target: EventLogTarget.REGISTRATION,
      old_data: {...registration},
      new_data: null,
    });

    return NextResponse.json(
      {
        message: "Registration deleted successfully",
        deleted_registration: serializeData({
          id: registration.id,
          team_name: registration.team_name,
          user_count: registration.registrationusers.length,
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration deletion error:", error);
    return NextResponse.json(
      { message: "Failed to delete registration" },
      { status: 500 }
    );
  }
}
