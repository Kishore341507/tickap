import { auth } from '@/auth'
import React from 'react'

export default async function Tournaments() {

  var session = await auth() ;

  return (
    <div>
      Hello {session?.user?.name}
    </div>
  )
}
