import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const file = await prisma.fileStorage.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!file) {
      return new Response('File not found', { status: 404 });
    }

    // Convert the Bytes data to Buffer
    const buffer = Buffer.from(file.data);

    // Return the file directly as a response with appropriate headers
    return new Response(buffer, {
      headers: {
        'Content-Type': file.mimetype,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}