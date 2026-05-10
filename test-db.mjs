import { PrismaClient } from "./src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        email: "test@test.com",
        name: "Test User",
        password: "hashedpassword123",
      },
    });
    console.log("User created:", user.id, user.email);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
