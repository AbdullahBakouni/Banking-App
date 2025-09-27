"use server";

import db from "@/drizzle/src";
import { banksTable, transactionsTable } from "@/drizzle/src/db/schema";
import { plaidClient } from "@/lib/plaid";
import { parseStringify } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { CountryCode } from "plaid";
import { getTransactionsByBankId } from "./transaction.actions";

export async function getAccounts(userId: string) {
  try {
    // 1. Get banks from DB
    const banks = await db
      .select()
      .from(banksTable)
      .where(eq(banksTable.userId, userId));

    if (!banks || banks.length === 0) {
      return parseStringify({
        data: [],
        totalBanks: 0,
        totalCurrentBalance: 0,
      });
    }

    // 2. Fetch account + institution info for each bank
    const accounts = await Promise.all(
      banks.map(async (bank) => {
        const accountsResponse = await plaidClient.accountsGet({
          access_token: bank.accessToken,
        });

        const accountData = accountsResponse.data.accounts[0];

        const institution = await getInstitution({
          institutionId: accountsResponse.data.item.institution_id!,
        });

        return {
          id: accountData.account_id,
          availableBalance: accountData.balances.available!,
          currentBalance: accountData.balances.current!,
          institutionId: institution.institution_id,
          name: accountData.name,
          officialName: accountData.official_name,
          mask: accountData.mask!,
          type: accountData.type as string,
          subtype: accountData.subtype! as string,
          bankId: bank.id, // drizzle pk
          shareableId: bank.shareableId,
        };
      }),
    );

    // 3. Aggregate totals
    const totalBanks = accounts.length;
    const totalCurrentBalance = accounts.reduce(
      (total, account) => total + account.currentBalance,
      0,
    );

    return parseStringify({
      data: accounts,
      totalBanks,
      totalCurrentBalance,
    });
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    return null;
  }
}
export async function getAccount(bankId: string) {
  try {
    // 1. Get bank from DB
    const [bank] = await db
      .select()
      .from(banksTable)
      .where(eq(banksTable.id, bankId));

    if (!bank) throw new Error("Bank not found");

    // 2. Get account info from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: bank.accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];
    // get transfer transactions from appwrite
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank.id,
    });

    const transferTransactions = transferTransactionsData.documents.map(
      (tx) => ({
        id: tx.id,
        name: tx.name!,
        amount: tx.amount!,
        date: tx.createdAt, // adjust column name
        paymentChannel: tx.channel,
        category: tx.category,
        type: tx.senderBankId === bank.id ? "debit" : "credit",
      }),
    );

    // 4. Get institution info from Plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    // 5. Get Plaid transactions
    const plaidTransactions = await getTransactions(bank.accessToken);
    // 6. Build account object
    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available!,
      currentBalance: accountData.balances.current!,
      institutionId: institution.institution_id,
      name: accountData.name,
      officialName: accountData.official_name,
      mask: accountData.mask!,
      type: accountData.type as string,
      subtype: accountData.subtype! as string,
      bankId: bank.id,
      shareableId: bank.shareableId,
    };

    // 7. Merge + sort transactions
    const allTransactions = [
      ...plaidTransactions,
      ...transferTransactions,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error("An error occurred while getting the account:", error);
    return null;
  }
}
export const getInstitution = async ({
  institutionId,
}: getInstitutionProps) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"] as CountryCode[],
    });

    const intitution = institutionResponse.data.institution;

    return parseStringify(intitution);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};

export async function getTransactions(accessToken: string) {
  let hasMore = true;
  let cursor: string | undefined = undefined; // for Plaid pagination
  const allTransactions: any[] = [];

  try {
    // Loop through all pages of transactions
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor: cursor,
      });

      const data = response.data;

      // Append newly added transactions
      allTransactions.push(
        ...data.added.map((transaction) => ({
          id: transaction.transaction_id,
          name: transaction.name,
          paymentChannel: transaction.payment_channel,
          type: transaction.transaction_type || transaction.payment_channel, // safer
          accountId: transaction.account_id,
          amount: transaction.amount,
          pending: transaction.pending,
          category: transaction.category ? transaction.category[0] : "",
          date: transaction.date,
          image: transaction.logo_url,
        })),
      );

      // Update cursor for next page
      cursor = data.next_cursor;
      hasMore = data.has_more;
    }

    // Sort by date (most recent first)
    allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return parseStringify(allTransactions);
  } catch (error) {
    console.error("❌ Error while getting transactions:", error);
    return [];
  }
}
