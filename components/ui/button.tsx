import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// D15 neon: pill-shaped controls, 2px tube outlines, acid fill for the primary.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-2 border-primary bg-primary text-primary-foreground hover:bg-transparent hover:text-primary",
        secondary: "border-2 border-violet bg-transparent text-foreground hover:bg-violet hover:text-background",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        ghost: "border-2 border-line bg-transparent text-foreground hover:border-primary",
        destructive: "border-2 border-destructive bg-transparent text-destructive hover:bg-destructive hover:text-destructive-foreground",
        link: "text-primary underline decoration-2 underline-offset-4 hover:decoration-violet",
        choice:
          "border-2 border-border bg-card text-foreground hover:border-primary aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground",
      },
      size: {
        // 44px minimum touch target on every demo-path control (h-11).
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
