"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import CustomInput from "./CustomInput";
import { Loader2 } from "lucide-react";
import { authFormSchema } from "@/lib/utils";
import { SignUp } from "@/actions/user.actions";
import { SignIn } from "@/actions/user.actions";
import { useRouter } from "next/navigation";
import PlaidLink from "./PlaidLink";
const AuthForm = ({ type }: { type: string }) => {
  type UserState = null | User;

  const [user, setUser] = useState<UserState>(null);
  const [errors, setErrors] = useState<string | null>(null);
  const [isLoading, setisLoading] = useState(false);
  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const router = useRouter();
  console.log(user);
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setisLoading(true);

    try {
      // Sign up with Appwrite & create plaid token

      if (type === "sign-up") {
        const userData = {
          firstName: data.firstName!,
          lastName: data.lastName!,
          address1: data.address1!,
          postalCode: data.postalCode!,
          city: data.city!,
          state: data.state!,
          dateOfBirth: data.dateOfBirth!,
          ssn: data.ssn!,
          email: data.email,
          password: data.password,
        };

        const newUser = await SignUp(userData);
        if (newUser?.user) {
          const newUserValue = {
            user: {
              id: newUser?.user.id,
              userId: newUser?.user.userId,
              firstName: newUser?.user.firstName,
              lastName: newUser?.user.lastName,
              address1: newUser?.user.address1,
              postalCode: newUser?.user.postalCode,
              city: newUser?.user.city,
              email: newUser?.user.email,
              state: newUser?.user.state,
              ssn: newUser?.user.ssn,
              dateOfBirth: newUser?.user.dateOfBirth,
              dwollaCustomerId: newUser?.user.dwollaCustomerId,
              dwollaCustomerUrl: newUser?.user.dwollaCustomerUrl,
            },
          };
          setUser(newUserValue.user);
        }
        if (newUser?.email_error) setErrors("Email already exists");
        if (newUser?.missing_error) setErrors("All fields are required");
      }
      if (type === "sign-in") {
        const response = await SignIn({
          email: data.email,
          password: data.password,
        });
        if (response.error_missing_credentials)
          setErrors("Email and password are required");
        if (response.error_inavalid_credentials)
          setErrors("Invalid Credentials");
        if (response.success_message) router.push("/");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setisLoading(false);
    }
  };

  return (
    <section className="auth-form">
      <header className="flex flex-col gap-5 md:gap-8">
        <Link href="/" className="cursor-pointer flex items-center gap-1">
          <Image
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Horizon logo"
          />
          <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">
            Horizon
          </h1>
        </Link>
        <div className="flex flex-col gap-1 md:gap-3">
          <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
            {user ? "Link Account" : type === "sign-in" ? "Sign In" : "Sign Up"}

            <p className="text-16 font-normal text-gray-600">
              {user
                ? "Link Your Account to get started"
                : "Please enter your details"}
            </p>
          </h1>
        </div>
      </header>
      {user ? (
        <div className="flex flex-col gap-4">
          <PlaidLink user={user} variant="primary" />
        </div>
      ) : (
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {type === "sign-up" && (
                <>
                  <div className="flex gap-4">
                    <CustomInput
                      control={form.control}
                      name="firstName"
                      label="First Name"
                      placeholder="Enter your first name"
                    />
                    <CustomInput
                      control={form.control}
                      name="lastName"
                      label="Last Name"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <CustomInput
                    control={form.control}
                    name="address1"
                    label="Address"
                    placeholder="Enter your specific address"
                  />
                  <CustomInput
                    control={form.control}
                    name="city"
                    label="City"
                    placeholder="Enter your city"
                  />
                  <div className="flex gap-4">
                    <CustomInput
                      control={form.control}
                      name="state"
                      label="State"
                      placeholder="Example: NY"
                    />
                    <CustomInput
                      control={form.control}
                      name="postalCode"
                      label="Postal Code"
                      placeholder="Example: 11101"
                    />
                  </div>
                  <div className="flex gap-4">
                    <CustomInput
                      control={form.control}
                      name="dateOfBirth"
                      label="Date of Birth"
                      placeholder="YYYY-MM-DD"
                    />
                    <CustomInput
                      control={form.control}
                      name="ssn"
                      label="SSN"
                      placeholder="Example: 1234"
                    />
                  </div>
                </>
              )}
              <CustomInput
                placeholder="Enter Your Email"
                label="Email"
                control={form.control}
                name="email"
              />
              <CustomInput
                placeholder="Enter Your Password"
                label="Password"
                control={form.control}
                name="password"
              />
              <div className="flex flex-col gap-4">
                <Button type="submit" className="form-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      &nbsp; Loading...
                    </>
                  ) : type === "sign-in" ? (
                    "Sign In"
                  ) : (
                    "Sign Up"
                  )}
                </Button>
                {errors && (
                  <div className="flex-center">
                    <p className="mt-2 text-16 text-red-500 font-semibold">
                      {errors}
                    </p>
                  </div>
                )}
              </div>
            </form>
          </Form>
          <footer className="flex justify-center gap-1">
            <p className="text-14 font-normal text-gray-600">
              {type === "sign-in"
                ? "Dont have an account?"
                : "Already have an account?"}
            </p>
            <Link
              href={type === "sign-in" ? "/sign-up" : "sign-in"}
              className="form-link"
            >
              {type === "sign-in" ? "Sign Up" : "Sign In"}
            </Link>
          </footer>
        </>
      )}
    </section>
  );
};

export default AuthForm;
