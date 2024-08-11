import React from "react";

export default function Home() {
  return (
    // <main className="text-center">
    //   <h1>We are Building tickAp...</h1>
    // </main>
    //redirect to /event
    <div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
          if (window.location.pathname === '/') {
            window.location.href = '/event';
          }
        `,
        }}
      />
      Baby , Bye Bye Bye ..... bye bye
    </div>
  );

}
