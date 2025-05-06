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
import { UserPlus, UserMinus, UserX, Trash2, RefreshCw, ListFilter } from "lucide-react";
import { RegistrationUser , Registration } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
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

                  {/* Team Members Section */}
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

                  {/* Custom Responses Section */}
                  {registration.extra && (
                    <div className="mt-6">
                      <Card className="border-dashed">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md flex items-center">
                            <ListFilter className="h-4 w-4 mr-2" />
                            Custom Responses
                          </CardTitle>
                          <CardDescription>
                            Additional information provided during registration
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {(() => {
                              try {
                                const extraData = typeof registration.extra === 'string'
                                  ? JSON.parse(registration.extra)
                                  : registration.extra;
                                
                                return Object.entries(extraData).map(([question, answerObj], index) => {
                                  const answer = typeof answerObj === 'string' 
                                    ? answerObj 
                                    : (answerObj as any)?.toString() || "No response";
                                    
                                  return (
                                    <div key={index} className="space-y-1">
                                      <h4 className="text-sm font-medium">{question}</h4>
                                      <p className="text-sm text-muted-foreground bg-secondary/30 p-2 rounded-md whitespace-pre-wrap">
                                        {answer}
                                      </p>
                                      {index < Object.entries(extraData).length - 1 && (
                                        <Separator className="my-2" />
                                      )}
                                    </div>
                                  );
                                });
                              } catch (e) {
                                return <p className="text-sm text-muted-foreground">Unable to display custom responses</p>;
                              }
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}