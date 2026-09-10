import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-swf-verde text-swf-crema hover:bg-swf-verde-claro disabled:bg-swf-verde/40",
  secondary:
    "bg-swf-dorado text-swf-verde hover:bg-swf-dorado/90 disabled:bg-swf-dorado/40",
  danger:
    "bg-red-700 text-white hover:bg-red-800 disabled:bg-red-700/40",
  ghost:
    "bg-transparent text-swf-verde border border-swf-verde/30 hover:bg-swf-verde/5",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={cn(base, variantClasses[variant], className)} {...props} />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, variantClasses[variant], className)}>
      {children}
    </Link>
  );
}
