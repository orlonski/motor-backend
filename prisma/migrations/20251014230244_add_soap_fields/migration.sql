-- AlterTable
ALTER TABLE "api_endpoints" ADD COLUMN     "body_template" TEXT,
ADD COLUMN     "request_type" VARCHAR(10) NOT NULL DEFAULT 'REST';
