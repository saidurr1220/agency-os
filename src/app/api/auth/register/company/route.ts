import { hashPassword } from "@better-auth/utils/password";
import type { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Interactive `$transaction` callback client (see Prisma `ITXClientDenyList`). */
type InteractivePrismaClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
>;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, companyName, companyEmail, phone, website, role } = body;

    if (!name || !email || !companyName || !companyEmail) {
      return NextResponse.json(
        { error: "Name, email, company name, and company email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase();

    // Validate role
    const companyRole = role === "CHAIRMAN" ? "CHAIRMAN" : "MANAGER";

    // Check if user already exists (Better Auth stores emails lowercased)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Generate company slug
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug is taken
    const existingCompany = await prisma.company.findUnique({
      where: { slug },
    });

    const finalSlug = existingCompany ? `${slug}-${Date.now()}` : slug;

    const passwordHash = await hashPassword(String(body.password));

    const { company } = await prisma.$transaction(async (tx: InteractivePrismaClient) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: passwordHash,
          systemRole: "USER",
          companyRole: companyRole,
        },
      });

      const company = await tx.company.create({
        data: {
          name: companyName,
          slug: finalSlug,
          email: companyEmail,
          phone: phone || null,
          website: website || null,
          status: "PENDING_APPROVAL",
          ownerId: user.id,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          companyId: company.id,
          companyRole: companyRole,
        },
      });

      await tx.companyMember.create({
        data: {
          companyId: company.id,
          userId: user.id,
          role: companyRole,
        },
      });

      // Email/password sign-in uses Better Auth credential account + hashed password (not User.password alone).
      await tx.account.create({
        data: {
          userId: user.id,
          provider: "credential",
          providerAccountId: user.id,
          password: passwordHash,
        },
      });

      return { company };
    });

    return NextResponse.json({
      success: true,
      message: "Company registered successfully. Pending approval.",
      companyId: company.id,
    });
  } catch (error) {
    console.error("Company registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
