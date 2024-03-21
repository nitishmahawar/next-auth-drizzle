import { registerSchema } from "@/lib/validators/register";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import bcrypt from "bcrypt";
import { mailer } from "@/lib/mailer";
import { render } from "@react-email/components";
import VerifyEmail from "@/emails/VerifyEmail";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";

export const POST = async (req: Request) => {
  try {
    const body = await req.json();

    const { email, name, password } = registerSchema.parse(body);

    // const user = await prisma.user.findUnique({ where: { email } });
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (user) {
      return new NextResponse("User already exists with this email!", {
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // const newUser = await prisma.user.create({
    //   data: { name, email, hashedPassword },
    // });
    const newUser = await db
      .insert(users)
      .values({ name, email, hashedPassword });

    const now = new Date();

    // const verification = await prisma.verificationToken.create({
    //   data: {
    //     identifier: email,
    //     token: crypto.randomUUID(),
    //     expires: new Date(now.getTime() + 24 * 60 * 60 * 1000 * 30),
    //   },
    // });

    const verification = await db
      .insert(verificationTokens)
      .values({
        identifier: email,
        token: crypto.randomUUID(),
        expires: new Date(now.getTime() + 24 * 60 * 60 * 1000 * 30),
      })
      .returning();

    const emailTemplate = render(
      VerifyEmail({
        verifyLink: `${process.env.APP_URL}/verify?token=${verification[0].token}`,
      })
    );

    await mailer.sendMail({
      to: email, // Change to your recipient
      from: "nitish.mahawar@apttechsols.com", // Change to your verified sender
      subject: "Verify Your Email",
      text: `Please verify your email`,
      html: emailTemplate,
    });

    return new NextResponse(JSON.stringify(newUser), { status: 201 });
  } catch (error) {
    console.log("[REGISTER_ERROR]", error);
    if (error instanceof ZodError) {
      return new NextResponse("Invalid email or password", { status: 422 });
    }
    return new NextResponse("Internal Error!", { status: 500 });
  }
};
