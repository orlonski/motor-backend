-- AlterTable
ALTER TABLE "api_endpoints" ADD COLUMN     "detected_scenario" VARCHAR(50),
ADD COLUMN     "last_tested_at" TIMESTAMPTZ,
ADD COLUMN     "request_example" JSONB,
ADD COLUMN     "response_example" JSONB;

-- AlterTable
ALTER TABLE "field_mappings" ADD COLUMN     "is_valid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "validated_at" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "validation_errors" (
    "id" UUID NOT NULL,
    "endpoint_id" UUID NOT NULL,
    "error_type" VARCHAR(100) NOT NULL,
    "error_message" TEXT NOT NULL,
    "suggestion" TEXT,
    "source_path" TEXT,
    "target_path" TEXT,
    "severity" VARCHAR(20) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_errors_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "validation_errors" ADD CONSTRAINT "validation_errors_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "api_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
