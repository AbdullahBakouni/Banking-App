import { getAccounts } from "@/actions/bank.actions";
import { getCurrentUser } from "@/actions/user.actions";
import BankCard from "@/components/BankCard";
import HeaderBox from "@/components/HeaderBox";
import React from "react";

const MyBanks = async () => {
  const loggedIn = await getCurrentUser();
  if (!loggedIn || !loggedIn.id) return;
  const accounts = await getAccounts(loggedIn?.id);
  if (!accounts) return;
  return (
    <section className="flex">
      <div className="my-banks">
        <HeaderBox
          title="My Bank Accounts"
          subtext="Effortlessly manage your banking activites."
        />

        <div className="space-y-4">
          <h2 className="header-2">Your cards</h2>
          <div className="flex flex-wrap gap-6">
            {accounts &&
              accounts.data.map((a: Account) => (
                <BankCard
                  key={a.bankId}
                  account={a}
                  userName={loggedIn?.firstName}
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyBanks;
