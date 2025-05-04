import { Card, CardContent, CardDescription, CardHeader, CardImage, CardTitle } from '@/components/ui/image-card';
import { Calendar, Gamepad2, Music, Trophy, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import React from 'react'
import { Event } from '@/types';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  // Function to get the appropriate icon based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'VideoGame':
        return <Gamepad2 className="h-4 w-4" />;
      case 'ESports':
        return <Trophy className="h-4 w-4" />;
      case 'Music':
        return <Music className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  // Format category name if custom category_name is not provided
  const displayCategory = event.category_name || event.category?.replace(/([A-Z])/g, ' $1').trim();

  return (
    <Link href={`/event/${event.id}`}>
      <Card className="border-secondary hover:scale-105 duration-500 ease-in-out cursor-pointer"  >
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
              {getCategoryIcon(event.category!)}
              <span>{displayCategory}</span>
            </CardDescription>
            <CardDescription className="flex gap-2 justify-center">
              <Calendar className="h-4 w-4" />
              <span>{event.date?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </CardDescription>
          </CardHeader>
          {/* <CardDescription className="text-center">
            {event.details?.length && event.details.length > 100
              ? event.details.slice(0, 100) + '...'
              : event.details}
          </CardDescription> */}
        </CardContent>
      </Card>
    </Link>
  )
}
