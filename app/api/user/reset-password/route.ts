import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { isExpired } from "@/lib/utils";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = async (req: Request) => {
  try {
    const { token, password } = await req.json();

    if (!token) {
      return new NextResponse("Verification token in required", {
        status: 400,
      });
    }

    if (!password) {
      return new NextResponse("Password is required!", { status: 400 });
    }

    // const resetToken = await prisma.resetPasswordToken.findUnique({
    //   where: { token },
    // });

    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: (prt, { eq }) => eq(prt.token, token),
    });

    if (!resetToken) {
      return new NextResponse("Invalid verification link", { status: 400 });
    }

    if (isExpired(resetToken.expires)) {
      return new NextResponse("Verification link is expired!", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // await prisma.user.update({
    //   where: { email: resetToken.identifier },
    //   data: { hashedPassword },
    // });

    await db
      .update(users)
      .set({ hashedPassword })
      .where(eq(users.email, resetToken.identifier));

    // await prisma.verificationToken.delete({ where: { token } });

    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));

    return new NextResponse("Password updated", { status: 200 });
  } catch (error) {
    console.log("RESET_PASSWORD_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};
