import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    const count = await prisma.user.count();
    
    // Try creating a test user
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash("testpass123", 12);
    
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        name: "Test User",
        password: hashedPassword,
      },
    });

    // Delete the test user
    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({
      success: true,
      message: "Database connection works",
      existingUsers: count,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
