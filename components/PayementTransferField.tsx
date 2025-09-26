"use client";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { BankDropdown } from "./BankDropdown";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Control, FieldPath, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { PaymentTransferFormSchema } from "@/lib/utils";
const formSchema = PaymentTransferFormSchema();
interface PaymentTransferFieldProps {
  control: Control<z.infer<typeof formSchema>>;
  name: FieldPath<z.infer<typeof formSchema>>;
  label: string;
  desc?: string;
  inputType: string;
  placeholder?: string;
  form?: UseFormReturn<z.infer<typeof formSchema>>;
  accounts?: Account[];
}
const PaymentTransferField = ({
  name,
  label,
  desc,
  inputType,
  control,
  placeholder,
  form,
  accounts,
}: PaymentTransferFieldProps) => {
  return (
    <>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="border-t border-gray-200">
            <div className="payment-transfer_form-item pb-6 pt-5">
              <div className="payment-transfer_form-content">
                <FormLabel className="text-14 font-medium text-gray-700">
                  {label}
                </FormLabel>
                <FormDescription className="text-12 font-normal text-gray-600">
                  {desc}
                </FormDescription>
              </div>
              <div className="flex w-full flex-col">
                <FormControl>
                  {inputType === "dropdown" ? (
                    <BankDropdown
                      accounts={accounts || []}
                      setValue={form?.setValue}
                      otherStyles="!w-full"
                    />
                  ) : inputType === "textarea" ? (
                    <Textarea
                      placeholder="Write a short note here"
                      className="input-class"
                      {...field}
                    />
                  ) : inputType === "input" ? (
                    <Input
                      placeholder={placeholder}
                      className="input-class"
                      {...field}
                    />
                  ) : null}
                </FormControl>
                <FormMessage className="text-12 text-red-500" />
              </div>
            </div>
          </FormItem>
        )}
      />
    </>
  );
};

export default PaymentTransferField;
