import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { CompanyRole, SystemRole } from "@prisma/client";
import { ORG_MANAGEMENT_ROLES } from "@/config/org-roles";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  systemRole: SystemRole;
  companyId: string | null;
  companyRole: CompanyRole;
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        systemRole: true,
        companyId: true,
        companyRole: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export function isSuperAdmin(user: AuthUser): boolean {
  return user.systemRole === "SUPER_ADMIN";
}

export function isCompanyAdmin(user: AuthUser): boolean {
  return ["CHAIRMAN", "MANAGER", "ADMIN"].includes(user.companyRole);
}

export function isManager(user: AuthUser): boolean {
  return ["CHAIRMAN", "MANAGER", "ADMIN", "TEAM_LEADER"].includes(
    user.companyRole
  );
}

/** Departments, designations, and member org assignment (broader than isManager). */
export function canManageOrgStructure(user: AuthUser): boolean {
  return (ORG_MANAGEMENT_ROLES as readonly string[]).includes(user.companyRole);
}

export function hasCompany(user: AuthUser): boolean {
  return !!user.companyId;
}

const COMPANY_ROUTES = [
  "/dashboard",
  "/tasks",
  "/projects",
  "/team",
  "/journal",
  "/analytics",
  "/calendar",
  "/settings",
  "/profile",
  "/notifications",
];

const MANAGER_ROUTES = ["/team", "/analytics"];

const SUPER_ADMIN_ROUTES = ["/admin"];

export function checkRouteAccess(
  pathname: string,
  user: AuthUser
): { allowed: boolean; redirect?: string } {
  // Admin panel: SUPER_ADMIN only
  if (pathname.startsWith("/admin")) {
    if (!isSuperAdmin(user)) {
      return { allowed: false, redirect: "/dashboard" };
    }
    return { allowed: true };
  }

  // Platform super-admin can access all other app routes without company/manager gates.
  if (isSuperAdmin(user)) {
    return { allowed: true };
  }

  // Manager-only routes (projects is open to all members with a company — see MANAGER_ROUTES)
  if (MANAGER_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!hasCompany(user)) {
      return { allowed: false, redirect: "/dashboard" };
    }
    if (!isManager(user)) {
      return { allowed: false, redirect: "/dashboard" };
    }
    return { allowed: true };
  }

  // Company routes - require company membership
  if (COMPANY_ROUTES.some((route) => pathname.startsWith(route))) {
    // General user without company can still access basic features
    return { allowed: true };
  }

  return { allowed: true };
}
