import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";

export default function Home() {
  return (
    <main>
      <Button>Click me</Button>
      <ModeToggle />
    </main>
  );
}
