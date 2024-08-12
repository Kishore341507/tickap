import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardImage, CardTitle } from '@/components/ui/card';
import { Calendar, Gamepad2 } from 'lucide-react';
import React from 'react'

interface Event {
    banner: string;
    name: string;
    category_name: string ;
    date?: Date;
    details?: string;
    status: string;
  }
  
interface EventCardProps {
    event: Event;
}

export default function eventCard( {event } : EventCardProps) {
  return (
    <Card className="border-secondary hover:scale-105 duration-500 ease-in-out"  >
        <CardImage
            src={event.banner!}
            alt={event.name!}
            width={200}
            height={200}
            style={{ backgroundImage: `url(${event.banner})` }}
            className="bg-cover bg-center backdrop-blur-lg"
            />
      <CardContent>
        <CardHeader className="text-center pb-3">
          <CardTitle>{event.name}</CardTitle>
          <CardDescription className="flex gap-2 justify-center">
            <Gamepad2 className="h-4 w-4" />
            <span>{event.category_name ? event.category_name : ' ' }</span>
          </CardDescription>
          <CardDescription className="flex gap-2 justify-center">
            <Calendar className="h-4 w-4" />
            <span>{event.date?.toDateString()}</span>
          </CardDescription>
        </CardHeader>
        <CardDescription className="text-center">
          {event.details?.length && event.details.length > 100
            ? event.details.slice(0, 100) + '...'
            : event.details}
        </CardDescription>
      </CardContent>
    </Card>
  )
}
