import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { permission } from "process";
import { Interface } from "readline";

interface Guild {
  id: string;
  name: string;
  permissions: string;
  icon: string;
}

export default async function Tournaments() {

  return <div>
    </div>;
}