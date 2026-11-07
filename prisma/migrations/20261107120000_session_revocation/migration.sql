-- Apenas aditiva: nenhuma coluna ou dado existente é alterado.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "RevokedToken" (
    "jti" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("jti")
);

CREATE INDEX "RevokedToken_expiresAt_idx" ON "RevokedToken"("expiresAt");
