"use client";

import { useState } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, UserMinus, UserX, Trash2, RefreshCw } from "lucide-react";

interface RegistrationUser {
  user_id: bigint;
  registration_id: bigint;
  event_id: bigint;
  user_name: string | null;
  pfp: string | null;
}

interface Registration {
  id: bigint;
  event_id: bigint;
  team_name: string | null;
  registrationusers: RegistrationUser[];
}

interface RegistrationsListProps {
  registrations: Registration[];
  isSolo: boolean;
  onAddUser: (registration: Registration) => void;
  onRemoveUser: (registration: Registration, user: RegistrationUser) => void;
  onReplaceUser: (registration: Registration, user: RegistrationUser) => void;
  onDeleteRegistration: (registration: Registration) => void;
}

export function RegistrationsList({ 
  registrations, 
  isSolo, 
  onAddUser, 
  onRemoveUser,
  onReplaceUser,
  onDeleteRegistration 
}: RegistrationsListProps) {
  return (
    <div className="space-y-4">
      {registrations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No registrations found</p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {registrations.map((registration) => (
            <AccordionItem key={registration.id.toString()} value={registration.id.toString()}>
              <div className="flex items-center justify-between">
                <AccordionTrigger className="flex-1 text-left hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-medium">
                      {registration.team_name || "Unnamed Team"}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {registration.registrationusers.length} {registration.registrationusers.length === 1 ? 'member' : 'members'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRegistration(registration);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Delete registration</span>
                </Button>
              </div>
              <AccordionContent>
                <div className="">
                  <div className="flex justify-between items-center mb-4">
                    {/* <h4 className="text-sm font-medium">Team Members ({registration.registrationusers.length})</h4> */}
                    <h4 className="text-sm font-medium"></h4>
                    {!isSolo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddUser(registration)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {registration.registrationusers.map((user) => (
                      <div
                        key={user.user_id.toString()}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.pfp || undefined} alt={user.user_name || "User"} />
                            <AvatarFallback>
                              {user.user_name 
                                ? user.user_name.substring(0, 2).toUpperCase() 
                                : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.user_name || "Unknown User"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              ID: {user.user_id.toString()}
                            </p>
                          </div>
                        </div>
                        {!isSolo && (
                          <div className="flex">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onReplaceUser(registration, user)}
                            >
                              <RefreshCw className="h-4 w-4" />
                              <span className="sr-only">Replace user</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveUser(registration, user)}
                              className="text-destructive"
                            >
                              <UserX className="h-4 w-4" />
                              <span className="sr-only">Remove user</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}