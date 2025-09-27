"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { decryptId } from "@/lib/utils";
import { Button } from "./ui/button";
import { createTransfer } from "@/actions/dwolla.actions";
import { getBank, getBankByAccountId } from "@/actions/user.actions";
import PaymentTransferField from "./PayementTransferField";
import { Form } from "./ui/form";
import { createTransaction } from "@/actions/transaction.actions";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(4, "Transfer note is too short"),
  amount: z.string().min(4, "Amount is too short"),
  senderBank: z.string().min(4, "Please select a valid bank account"),
  sharableId: z.string().min(8, "Please select a valid sharable Id"),
});

const PaymentTransferForm = ({ accounts }: PaymentTransferFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      amount: "",
      senderBank: "",
      sharableId: "",
    },
  });

  const submit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const receiverAccountId = decryptId(data.sharableId);
      const receiverBank = await getBankByAccountId(receiverAccountId);
      const senderBank = await getBank(data.senderBank);
      const transferParams = {
        sourceFundingSourceUrl: senderBank.fundingSourceUrl,
        destinationFundingSourceUrl: receiverBank.fundingSourceUrl,
        amount: data.amount,
      };
      // create transfer
      const transfer = await createTransfer(transferParams);

      // create transfer transaction
      if (transfer) {
        const transaction = {
          name: data.name,
          amount: data.amount,
          senderId: senderBank.userId,
          senderBankId: senderBank.id,
          receiverId: receiverBank.userId,
          receiverBankId: receiverBank.id,
          email: data.email,
        };

        const newTransaction = await createTransaction(transaction);

        if (newTransaction) {
          form.reset();
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Submitting create transfer request failed: ", error);
    }

    setIsLoading(false);
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="flex flex-col">
        <PaymentTransferField
          name="senderBank"
          label="Select Source Bank"
          desc="Select the bank account you want to transfer funds from"
          control={form.control}
          inputType="dropdown"
          accounts={accounts}
          form={form}
        />

        <PaymentTransferField
          name="name"
          label="Transfer Note (Optional)"
          desc="Please provide any additional information or instructions"
          control={form.control}
          inputType="textarea"
          placeholder="Write a short note here"
        />
        <div className="payment-transfer_form-details">
          <h2 className="text-18 font-semibold text-gray-900">
            Bank account details
          </h2>
          <p className="text-16 font-normal text-gray-600">
            Enter the bank account details of the recipient
          </p>
        </div>
        <PaymentTransferField
          name="email"
          label="Recipient's Email Address"
          control={form.control}
          inputType="input"
          placeholder="ex: johndoe@gmail.com"
        />
        <PaymentTransferField
          name="sharableId"
          label=" Receiver's Plaid Sharable Id"
          control={form.control}
          inputType="input"
          placeholder="Enter the public account number"
        />

        <PaymentTransferField
          name="amount"
          label="Amount"
          control={form.control}
          inputType="input"
          placeholder="ex: 5.00"
        />
        <div className="payment-transfer_btn-box">
          <Button type="submit" className="payment-transfer_btn">
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> &nbsp; Sending...
              </>
            ) : (
              "Transfer Funds"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentTransferForm;
