"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { DATABASE_ID, USERS_COLLECTION_ID } from "../appwrite/config";

const getUserByEmail = async (email: string) => {
  const { database } = await createAdminClient();

  const users = await database.listDocuments(
    DATABASE_ID!,
    USERS_COLLECTION_ID!,
    [Query.equal("email", [email])]
  );

  return users.total > 0 ? users.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.error(error, message);

  throw error;
};

const sendEmailOTP = async (email: string) => {
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken(ID.unique(), email);

    return session.userId;
  } catch (error) {
    handleError(error, "Failed to send email OTP");
  }
};

export const createAccount = async (fullName: string, email: string) => {
  const existingUser = await getUserByEmail(email);

  const accountId = await sendEmailOTP(email);

  if (!accountId) throw new Error("Failed to send email OTP");

  if (!existingUser) {
    const { database } = await createAdminClient();

    await database.createDocument(
      DATABASE_ID!,
      USERS_COLLECTION_ID!,
      ID.unique(),
      {
        fullName,
        email,
        avatar:
          "https://storage.needpix.com/rsynced_images/avatar-1577909_1280.png",
        accountId,
      }
    );
  }

  return { accountId };
};
