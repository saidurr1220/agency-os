/** Roles allowed to edit departments, designations, and member org assignment (mirrors server `canManageOrgStructure`). */
export const ORG_MANAGEMENT_ROLES = [
  "CHAIRMAN",
  "BOARD_MEMBER",
  "MANAGER",
  "ADMIN",
  "HR",
  "TEAM_LEADER",
] as const;

export function userCanManageOrg(companyRole?: string | null): boolean {
  if (!companyRole) return false;
  return (ORG_MANAGEMENT_ROLES as readonly string[]).includes(companyRole);
}
