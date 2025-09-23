"use server";

import db from "@/drizzle/src";
import { banksTable, usersTable } from "@/drizzle/src/db/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import {
  CountryCode,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  Products,
} from "plaid";
import { plaidClient } from "@/lib/plaid";
import {
  encryptId,
  extractCustomerIdFromUrl,
  parseStringify,
} from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export async function SignUp({
  firstName,
  lastName,
  address1,
  postalCode,
  city,
  state,
  dateOfBirth,
  ssn,
  email,
  password,
}: SignUpParams) {
  try {
    if (
      !firstName ||
      !lastName ||
      !address1 ||
      !postalCode ||
      !city ||
      !state ||
      !dateOfBirth ||
      !ssn ||
      !email ||
      !password
    ) {
      return { missing_error: "All fields are required" };
    }
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existingUser.length > 0) {
      return { email_error: "Email already exists" };
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(usersTable)
      .values({
        firstname: firstName,
        lastname: lastName,
        postalcode: postalCode,
        address: address1,
        city: city,
        state: state,
        dateofbirth: dateOfBirth,
        ssn: ssn,
        email: email,
        password: hashedPassword,
      })
      .returning();

    if (!user) throw new Error("Error creating user");

    const dwollaCustomerUrl = await createDwollaCustomer({
      firstName,
      lastName,
      address1,
      postalCode,
      city,
      state,
      dateOfBirth,
      ssn,
      email,
      type: "personal",
    });

    if (!dwollaCustomerUrl) throw new Error("Error creating Dwolla customer");

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

    const [newuser] = await db
      .update(usersTable)
      .set({
        firstname: firstName,
        lastname: lastName,
        address: address1,
        city: city,
        state: state,
        dateofbirth: dateOfBirth,
        ssn: ssn,
        email: email,
        password: hashedPassword,
        dwollaCustomerId: dwollaCustomerId,
        dwollaCustomerUrl: dwollaCustomerUrl,
      })
      .where(eq(usersTable.id, user.id))
      .returning();
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1d",
    });
    const cookie = await cookies();
    cookie.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1day
      path: "/",
    });
    if (newuser) {
      return {
        user: {
          id: newuser.id,
          userId: newuser.userid,
          firstName: newuser.firstname,
          lastName: newuser.lastname,
          postalCode: newuser.postalcode,
          address1: newuser.address,
          city: newuser.city,
          email: newuser.email,
          state: newuser.state,
          ssn: newuser.ssn,
          dateOfBirth: newuser.dateofbirth,
          dwollaCustomerId: newuser.dwollaCustomerId,
          dwollaCustomerUrl: newuser.dwollaCustomerUrl,
        },
      };
    }
    if (!newuser) throw new Error("Errro Updating User");
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }
  }
}

export async function SignIn({ email, password }: LoginUser) {
  try {
    if (!email || !password) {
      return { error_missing_credentials: "Email and password are required" };
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (!user) {
      return { error_inavalid_credentials: "Invalid credentials" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { error_inavalid_credentials: "Invalid credentials" };
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    const cookie = await cookies();
    cookie.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return {
      success_message: "Signed in successfully",
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
      },
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    return {
      error: "Internal Server Error",
    };
  }
}

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.id,
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ["auth"] as Products[],
      language: "en",
      country_codes: ["US"] as CountryCode[],
    };

    const response = await plaidClient.linkTokenCreate(tokenParams);

    return parseStringify({ linkToken: response.data.link_token });
  } catch (error) {
    console.log(error);
  }
};
export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const [bankAccount] = await db
      .insert(banksTable)
      .values({
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId,
      })
      .returning();

    return bankAccount;
  } catch (error) {
    console.error("Error creating bank account:", error);
    throw error;
  }
};
export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    // Exchange public token for access token and item ID
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Get account information from Plaid using the access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];

    // Create a processor token for Dwolla using the access token and account ID
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    };

    const processorTokenResponse =
      await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

    // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId || "",
      processorToken,
      bankName: accountData.name,
    });

    // If the funding source URL is not created, throw an error
    if (!fundingSourceUrl) throw Error;

    // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and shareableId ID
    await createBankAccount({
      userId: user.id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: encryptId(accountData.account_id),
    });

    // Revalidate the path to reflect the changes
    revalidatePath("/");

    // Return a success message
    return parseStringify({
      publicTokenExchange: "complete",
    });
  } catch (error) {
    console.error("An error occurred while creating exchanging token:", error);
  }
};
