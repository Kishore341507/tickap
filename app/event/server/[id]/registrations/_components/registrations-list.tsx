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
import { UserPlus, UserX, Trash2, RefreshCw, Copy, Check } from "lucide-react";
import { RegistrationUser , Registration } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface RegistrationsListProps {
  registrations: Registration[];
  isSolo: boolean;
  onAddUser: (registration: Registration) => void;
  onRemoveUser: (registration: Registration, user: RegistrationUser) => void;
  onReplaceUser: (registration: Registration, user: RegistrationUser) => void;
  onDeleteRegistration: (registration: Registration) => void;
}

function CopyableText({ text, className }: { text: string, className?: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div 
      className={`flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={handleCopy}
    >
      <div className="truncate">
        {text}
      </div>
      {isCopied ? (
        <Check className="h-3 w-3 text-green-500 animate-in zoom-in duration-300 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground shrink-0" />
      )}
    </div>
  );
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
            <AccordionItem key={registration.id.toString()} value={registration.id.toString()} className="group">
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
                <div className="flex items-center gap-1 mr-2">
                  {!isSolo && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hidden group-data-[state=open]:inline-flex"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddUser(registration);
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                            <span className="sr-only">Add member</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Member</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRegistration(registration);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete registration</span>
                  </Button>
                </div>
              </div>
              <AccordionContent>
                <div className="space-y-4">

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
                            <CopyableText 
                              text={user.user_id.toString()} 
                              className="text-xs text-muted-foreground"
                            />
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
                        <CardContent className="p-2">
                          <div className="space-y-0">
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
                                    <div key={index}>
                                      <h4 className="text-sm font-medium">{question}</h4>
                                      <div className="bg-secondary/30 p-1 rounded-md">
                                        <CopyableText 
                                          text={answer} 
                                          className="text-sm text-muted-foreground whitespace-pre-wrap"
                                        />
                                      </div>
                                      {index < Object.entries(extraData).length - 1 && (
                                        <Separator className="my-1" />
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