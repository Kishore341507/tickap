import React from 'react';
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-8">
        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">1. Introduction</h2>
          <p className="leading-7 text-muted-foreground">
            Welcome to Tickap Events App. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our website 
            and tell you about your privacy rights and how the law protects you.
          </p>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">2. Data We Collect</h2>
          <p className="leading-7 text-muted-foreground mb-4">
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
          </p>
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2 text-muted-foreground">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform and other technology on the devices you use to access this website.</li>
          </ul>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">3. How We Use Your Data</h2>
          <p className="leading-7 text-muted-foreground mb-4">
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2 text-muted-foreground">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal or regulatory obligation.</li>
          </ul>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">4. Data Security</h2>
          <p className="leading-7 text-muted-foreground">
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
          </p>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">5. Contact Us</h2>
          <p className="leading-7 text-muted-foreground">
            If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:support@tickap.com" className="font-medium text-primary underline underline-offset-4">support@tickap.com</a>
          </p>
        </section>
      </div>
      
      <Separator className="my-10" />
      <p className="text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Tickap. All rights reserved.
      </p>
    </div>
  );
}
