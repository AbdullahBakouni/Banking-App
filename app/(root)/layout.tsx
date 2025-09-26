import { getCurrentUser } from "@/actions/user.actions";
import MobileNav from "@/components/MobileNav";
import SideBar from "@/components/SideBar";
import Image from "next/image";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggendin = await getCurrentUser();
  return (
    <main className="flex h-screen w-full font-inter">
      <SideBar user={loggendin} />

      <div className="flex flex-col size-full">
        <div className="root-layout">
          <Image src="/icons/logo.svg" width={30} height={30} alt="Menu" />
          <div>
            <MobileNav user={loggendin} />
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
