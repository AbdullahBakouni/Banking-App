import { getAccount, getAccounts } from "@/actions/bank.actions";
import { getCurrentUser } from "@/actions/user.actions";
import HeaderBox from "@/components/HeaderBox";
import RecentTransaction from "@/components/RecentTransaction";
import RightSidebar from "@/components/RightSidebar";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import React from "react";

const Home = async ({ searchParams: { id, page } }: SearchParamProps) => {
  const currentPage = Number((page as string) || 1);
  const loggedin = await getCurrentUser();
  if (!loggedin || !loggedin.id) return;
  const accounts = await getAccounts(loggedin?.id);
  if (!accounts) return;
  const accountsData = accounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.bankId;
  const account = await getAccount(appwriteItemId);
  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedin?.firstName || "Guest"}
            subtext="Access and Manage your account and transaction efficiently."
          />
          <TotalBalanceBox
            accounts={accountsData}
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance}
          />
        </header>
        <RecentTransaction
          accounts={accountsData}
          transactions={account?.transactions}
          page={currentPage}
          appwriteItemId={appwriteItemId}
        />
      </div>
      <RightSidebar
        user={loggedin}
        transactions={account?.transactions}
        banks={accountsData?.slice(0, 2)}
      />
    </section>
  );
};

export default Home;
