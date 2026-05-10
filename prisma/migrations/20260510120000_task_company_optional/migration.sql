-- Personal tasks: allow rows without a company (creator-scoped in API).
ALTER TABLE "tasks" ALTER COLUMN "companyId" DROP NOT NULL;
