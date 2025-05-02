import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { getMember } from "@/lib/discord";

export async function POST(
  request: NextRequest,
  { params }: {params: Promise<{ id: string }>} 
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
    
    const userId = BigInt(session!.user!.userId!) ;
    // Get the event by ID
    const event = await prisma.events.findUnique({
      where: { id: BigInt(id) },
      include: {
        registrations: {
          where: {
            registrationusers: {
              some: {
                user_id: userId,
              },
            },
          },
        },
      },
    });

    // Check if event exists
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Check if event is open for registration
    if (event.status !== "Open") {
      return NextResponse.json(
        { message: `Event registration is ${event.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check if user is already registered
    if (event.registrations.length > 0) {
      return NextResponse.json(
        { message: "You are already registered for this event" },
        { status: 400 }
      );
    }

    // Check if maximum participants limit is reached
    const registrationsCount = await prisma.registrations.count({
      where: { event_id: BigInt(id) },
    });

    if (event.max_teams && registrationsCount >= Number(event.max_teams)) {
      return NextResponse.json(
        { message: "Event has reached maximum participants" },
        { status: 400 }
      );
    }

    // Solo event registration
    if (event.is_solo === true) {
      // Create a new registration for solo participant
      const registration = await prisma.registrations.create({
        data: {
          event_id: BigInt(id),
          team_name: teamName || `${session.user.name}'s Team`,
          registrationusers: {
            create: {
              user_id: userId,
              user_name: session.user.name,
              pfp: session.user.image || null,
              event_id: BigInt(id),
            },
          },
        },
      });

      return NextResponse.json(
        { message: "Registration successful" },
        { status: 201 }
      );
    }
    
    // Team event registration
    
    // Validate team name
    if (!teamName || teamName.trim().length < 3 || teamName.trim().length > 40) {
      return NextResponse.json(
        { message: "Team name must be between 3 and 40 characters" },
        { status: 400 }
      );
    }

    // Validate team size
    if (event.min_team_player && teamMembers.length + 1 < event.min_team_player) {
      return NextResponse.json(
        { message: `Team must have at least ${event.min_team_player} members (including you)` },
        { status: 400 }
      );
    }

    if (event.max_team_player && teamMembers.length + 1 > event.max_team_player) {
      return NextResponse.json(
        { message: `Team cannot have more than ${event.max_team_player} members (including you)` },
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
        { message: "One or more team members are already registered for this event" },
        { status: 400 }
      );
    }

    // Get guild_id from event for Discord API calls
    if (!event.guild_id) {
      return NextResponse.json(
        { message: "Event is not associated with a Discord server" },
        { status: 400 }
      );
    }

    // Fetch Discord information for all team members
    const teamMembersData = await Promise.all(
      teamMembers.map(async (memberId: string) => {
        const memberData = await getMember(event.guild_id!.toString(), memberId);
        
        // If member data couldn't be fetched, use basic information
        if (!memberData) {
          return {
            user_id: BigInt(memberId),
            user_name: null,
            pfp: null,
            event_id: BigInt(id),
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
        };
      })
    );

    // Create team registration with all members
    const registration = await prisma.registrations.create({
      data: {
        event_id: BigInt(id),
        team_name: teamName,
        registrationusers: {
          create: [
            // Register the current user
            {
              user_id: userId,
              user_name: session.user.name,
              pfp: session.user.image || null,
              event_id: BigInt(id),
            },
            // Register all team members with their Discord information
            ...teamMembersData,
          ],
        },
      },
    });

    return NextResponse.json(
      { message: "Team registration successful" },
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

export async function DELETE(
  request: NextRequest,
  { params }: {params: Promise<{ id: string }>} 
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }
    
    const userId = BigInt(session.user.userId!);

    // Get the event by ID with the user's registration
    const event = await prisma.events.findUnique({
      where: { id: BigInt(id) },
      include: {
        registrations: {
          where: {
            registrationusers: {
              some: {
                user_id: userId,
              },
            },
          },
          include: {
            registrationusers: true,
          },
        },
      },
    });

    // Check if event exists
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Check if user is registered for this event
    if (event.registrations.length === 0) {
      return NextResponse.json(
        { message: "You are not registered for this event" },
        { status: 400 }
      );
    }

    const registration = event.registrations[0];

    // Case 1: Solo event - Delete the entire registration
    if (event.is_solo === true) {
      await prisma.registrations.delete({
        where: {
          id: registration.id,
        },
      });

      return NextResponse.json(
        { message: "Successfully unregistered from the event" },
        { status: 200 }
      );
    }

    // Case 2: Team event
    // Calculate the number of members in the team excluding the current user
    const remainingMembers = registration.registrationusers.filter(
      user => user.user_id !== userId
    );

    // If removing the user would make the team too small based on min_team_player,
    // or if this was the last team member, delete the entire registration
    if (!remainingMembers.length || 
        (event.min_team_player && remainingMembers.length < event.min_team_player)) {
      await prisma.registrations.delete({
        where: {
          id: registration.id,
        },
      });

      return NextResponse.json(
        { message: "Your team has been removed from the event" },
        { status: 200 }
      );
    } 
    
    // Otherwise, just remove this user from the team
    else {
      await prisma.registrationusers.delete({
        where: {
          user_id_registration_id: {
            user_id: userId,
            registration_id: registration.id,
          },
        },
      });

      return NextResponse.json(
        { message: "You have been removed from the team" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Unregistration error:", error);
    return NextResponse.json(
      { message: "Failed to unregister from event" },
      { status: 500 }
    );
  }
}