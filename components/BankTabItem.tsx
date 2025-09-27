"use client";

import { cn, formUrlQuery } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

const BankTabItem = ({ account, appwriteItemId }: BankTabItemProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isActive = appwriteItemId === account?.bankId;
  const handleBankChange = () => {
    const currentBankId = searchParams.get("id");
    const nextBankId = account?.bankId;

    // Only update if bankId is different
    if (currentBankId !== nextBankId) {
      // Build new URL with updated bankId
      let newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: "id",
        value: nextBankId,
      });

      // Reset page=1 if it's not already 1
      const url = new URL(newUrl, window.location.origin);
      if (Number(url.searchParams.get("page")) > 1) {
        url.searchParams.set("page", "1");
        newUrl = url.pathname + "?" + url.searchParams.toString();
      }

      router.push(newUrl, { scroll: false });
    }
  };

  return (
    <div
      onClick={handleBankChange}
      className={cn(`banktab-item cursor-pointer`, {
        " border-blue-600": isActive,
      })}
    >
      <p
        className={cn(`text-16 line-clamp-1 flex-1 font-medium text-gray-500`, {
          " text-blue-600": isActive,
        })}
      >
        {account.name}
      </p>
    </div>
  );
};

export default BankTabItem;
