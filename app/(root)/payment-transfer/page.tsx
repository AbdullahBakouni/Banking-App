import { getAccounts } from "@/actions/bank.actions";
import { getCurrentUser } from "@/actions/user.actions";
import HeaderBox from "@/components/HeaderBox";
import PaymentTransferForm from "@/components/PaymentTransferForm";

const PaymenTransfer = async () => {
  const loggedIn = await getCurrentUser();
  if (!loggedIn || !loggedIn.id) return;
  const accounts = await getAccounts(loggedIn?.id);
  if (!accounts) return;
  const accountsData = accounts?.data;
  return (
    <section className="payment-transfer">
      <HeaderBox
        title="Payment Transfer"
        subtext="Please provide any specifc details or notes related to the payment transfer"
      />
      <section className="size-full pt-5">
        <PaymentTransferForm accounts={accountsData} />
      </section>
    </section>
  );
};

export default PaymenTransfer;
