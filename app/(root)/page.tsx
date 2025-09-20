import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "@/components/RightSidebar";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import React from "react";

const Home: React.FC = () => {
  const loggedin = {
    firstName: "Abdullah",
    lastName: "Bakouni",
    email: "aboodbak70@gmail.com",
  };
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
            accounts={[]}
            totalBanks={1}
            totalCurrentBalance={1250.76}
          />
        </header>
        {/*Recent Transcations*/}
      </div>
      <RightSidebar
        user={loggedin}
        transactions={[]}
        banks={[{ currentBalance: 124.5 }, { currentBalance: 125.69 }]}
      />
    </section>
  );
};

export default Home;
