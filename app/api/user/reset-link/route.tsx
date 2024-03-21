import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";
import { mailer } from "@/lib/mailer";
import { render } from "@react-email/components";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const { email } = await req.json();

    // const user = await prisma.user.findUnique({ where: { email } });
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (!user) {
      return new NextResponse("User not found with this email", {
        status: 400,
      });
    }

    if (!user.hashedPassword) {
      return new NextResponse("User was created using social Id", {
        status: 400,
      });
    }

    const now = new Date();

    // const resetToken = await prisma.resetPasswordToken.create({
    //   data: {
    //     expires: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    //     identifier: email,
    //     token: crypto.randomUUID(),
    //   },
    // });

    const resetToken = await db
      .insert(passwordResetTokens)
      .values({
        expires: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        identifier: email,
        token: crypto.randomUUID(),
      })
      .returning();

    const emailTemplate = render(
      ResetPasswordEmail({
        resetPasswordLink: `${process.env.APP_URL}/reset-password?token=${resetToken[0].token}`,
      })
    );

    await mailer.sendMail({
      to: email, // Change to your recipient
      from: "nitish.mahawar@apttechsols.com", // Change to your verified sender
      subject: "Reset Password",
      text: `Reset password of your Auth account`,
      html: emailTemplate,
    });

    return new NextResponse("Reset password link is sent to your email");
  } catch (error) {
    console.log("RESET_LINK_ERROR", error);
    return new NextResponse("Internal Error!");
  }
};
