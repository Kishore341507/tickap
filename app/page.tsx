import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1 className="" >Hello World</h1>
      <Link href="/users"> Go to users</Link>
    </main>
  );
}
