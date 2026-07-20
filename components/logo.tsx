import Link from "next/link";
import Image from "next/image";
import wordmark from "@/public/images/品牌字.png";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center hover:opacity-95 transition-opacity"
    >
      <Image
        src={wordmark}
        alt="skmint"
        height={28}
        className="h-7 w-auto shrink-0"
        priority
      />
    </Link>
  );
}
