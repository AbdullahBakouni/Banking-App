"use server";

import db from "@/drizzle/src";
import { transactionsTable } from "@/drizzle/src/db/schema";
import { eq, or } from "drizzle-orm";
export const createTransaction = async (
  transaction: CreateTransactionProps,
) => {
  try {
    const [newTransaction] = await db
      .insert(transactionsTable)
      .values({
        channel: "online", // default
        category: "Transfer", // default
        name: transaction.name,
        amount: transaction.amount,
        senderId: transaction.senderId,
        senderBankId: transaction.senderBankId,
        receiverId: transaction.receiverId,
        receiverBankId: transaction.receiverBankId,
        email: transaction.email,
      })
      .returning();

    return newTransaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export const getTransactionsByBankId = async ({
  bankId,
}: getTransactionsByBankIdProps) => {
  try {
    const transactions = await db
      .select()
      .from(transactionsTable)
      .where(
        or(
          eq(transactionsTable.senderBankId, bankId),
          eq(transactionsTable.receiverBankId, bankId),
        ),
      );

    return {
      total: transactions.length,
      documents: transactions,
    };
  } catch (error) {
    console.error("Error fetching transactions by bankId:", error);
    throw error;
  }
};
