import type { NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const Home: NextPage = () => {
  const router = useRouter();
  useEffect(() => {
    router.push({ pathname: "/" });
    router.push("/");
  }, []);

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Link href="/">Home</Link>
        <Link href={{ pathname: "/" }}>Home</Link>
      </main>
    </>
  );
};

export default Home;