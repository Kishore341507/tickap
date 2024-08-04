import React from 'react'
import TournamentSideBar from './_components/tournament-side-bar'
import TournamentTopNav from './_components/tournament-top-nav'

export default function TournamentLayout({ children } : { children: React.ReactNode }) {
  return (
    <div className='grid min-h-screen w-full lg:grid-cols-[280px_1fr]'>
        <TournamentSideBar></TournamentSideBar>
        <TournamentTopNav>
            <main className="flex flex-col gap-4 p-4 lg:gap-6">
                {children}
            </main>
        </TournamentTopNav>
    </div>
  )
}