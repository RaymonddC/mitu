-- Update all existing employers to have isDeleted = false if they don't have it set
UPDATE employers 
SET "isDeleted" = false 
WHERE "isDeleted" IS NULL;
