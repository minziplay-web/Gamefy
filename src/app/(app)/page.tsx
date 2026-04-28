"use client";

import { HomeScreen } from "@/components/home/home-screen";
import { useHomeViewState } from "@/lib/firebase/home";

export default function HomePage() {
  const state = useHomeViewState();

  return <HomeScreen state={state} />;
}
