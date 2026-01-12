import React from 'react';
import { Separator } from "@/components/ui/separator";

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">Terms and Conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-8">
        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">1. Agreement to Terms</h2>
          <p className="leading-7 text-muted-foreground">
            By accessing or using the Tickap Events App, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, then you may not access the service.
          </p>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">2. Use License</h2>
          <p className="leading-7 text-muted-foreground">
            Permission is granted to temporarily download one copy of the materials (information or software) on Tickap for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </p>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">3. User Accounts</h2>
          <p className="leading-7 text-muted-foreground">
            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">4. Event Creation and Management</h2>
          <p className="leading-7 text-muted-foreground">
            Users who create events are responsible for the content and accuracy of their event details. Tickap is not responsible for any cancellations or changes to events made by organizers.
          </p>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">5. Ticketing and Payments</h2>
          <p className="leading-7 text-muted-foreground">
            Tickap facilitates the sale of tickets but is not the organizer of the events. Any disputes regarding refunds or event quality should be directed to the event organizer, though we will assist where possible.
          </p>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">6. Termination</h2>
          <p className="leading-7 text-muted-foreground">
            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">7. Governing Law</h2>
          <p className="leading-7 text-muted-foreground">
             These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">8. Changes</h2>
          <p className="leading-7 text-muted-foreground">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
        </section>

        <section>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4">9. Contact Us</h2>
          <p className="leading-7 text-muted-foreground">
            If you have any questions about these Terms, please contact us at: <a href="mailto:support@tickap.com" className="font-medium text-primary underline underline-offset-4">support@tickap.com</a>
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
