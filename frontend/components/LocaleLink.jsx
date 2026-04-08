"use client";

import Link from "next/link";
import { useLocalePath } from "../context/LanguageContext";

export default function LocaleLink({ href, ...props }) {
  const localePath = useLocalePath();
  return <Link href={localePath(href || "/")} {...props} />;
}
