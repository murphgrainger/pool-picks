import crypto from "crypto";
import { prisma } from "@pool-picks/db";

// Excludes ambiguous characters: O/0/I/1/L
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const MAX_RETRIES = 5;

function generateCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
}

export async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateCode();
    const existing = await prisma.pool.findUnique({
      where: { invite_code: code },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique invite code");
}
