import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { User } from "@prisma/client"; // assuming you're using the default `User` model

export const checkUser = async (): Promise<User | null | undefined> => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const name = user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName;

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    return newUser;
  } catch (err) {
    console.error("Failed to check or create user:", err);
    return undefined;
  }
};
