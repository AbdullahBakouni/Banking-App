import { getAccount, getAccounts } from "@/actions/bank.actions";
import { getCurrentUser } from "@/actions/user.actions";
import HeaderBox from "@/components/HeaderBox";
import TransactionsTable from "@/components/TransactionsTable";
import { formatAmount } from "@/lib/utils";
import React from "react";

const TransactionHistory = async ({
  searchParams: { id, page },
}: SearchParamProps) => {
  const currentPage = Number((page as string) || 1);
  const loggedin = await getCurrentUser();
  if (!loggedin || !loggedin.id) return;
  const accounts = await getAccounts(loggedin?.id);
  if (!accounts) return;
  const accountsData = accounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.bankId;
  const account = await getAccount(appwriteItemId);
  return (
    <section className="transactions">
      <div className="transactions-header">
        <HeaderBox
          title="Transaction History"
          subtext="See your bank details and transactions."
        />
      </div>
      <div className="space-y-6">
        <div className="transactions-account">
          <div className="flex flex-col gap-2">
            <h2 className="text-white text-18 font-bold">
              {account?.data.name}
            </h2>
            <p className="text-blue-25 text-14">{account?.data.officialName}</p>
            <p className="text-14 font-semibold tracking-[1.1px] text-white">
              ●●●● ●●●● ●●●● {account?.data.mask}
            </p>
          </div>
          <div className="transactions-account-balance">
            <p className="text-14">Current balance</p>
            <p className="text-24 text-center font-bold">
              {formatAmount(account?.data.currentBalance)}
            </p>
          </div>
        </div>
        <section className="flex w-full flex-col gap-6">
          <TransactionsTable transactions={account?.transactions} />
        </section>
      </div>
    </section>
  );
};

export default TransactionHistory;
