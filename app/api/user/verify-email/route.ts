import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse("Verification token is required", {
        status: 400,
      });
    }

    // const verification = await prisma.verificationToken.findUnique({
    //   where: {
    //     token,
    //   },
    // });
    const verification = await db.query.verificationTokens.findFirst({
      where: (vt, { eq }) => eq(vt.token, token),
    });

    if (!verification) {
      return new NextResponse("Invalid verification link", { status: 400 });
    }

    // const user = await prisma.user.findUnique({
    //   where: { email: verification.identifier },
    // });

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, verification.identifier),
    });

    if (!user) {
      return new NextResponse("User not found!", { status: 400 });
    }

    if (user.emailVerified) {
      return new NextResponse("Email already verified!", { status: 400 });
    }

    // await prisma.user.update({
    //   where: { email: verification.identifier },
    //   data: { emailVerified: new Date() },
    // });

    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, verification.identifier));

    // await prisma.verificationToken.delete({ where: { token } });
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token));

    return new NextResponse("Email Verified. Please login to your account");
  } catch (error) {
    console.log("VERIFY_EMAIL", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};
