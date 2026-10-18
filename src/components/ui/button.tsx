import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-display text-[15px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-action text-action-foreground hover:bg-action-hover hover:text-action-foreground",
        outline:
          "border border-border-strong bg-transparent hover:bg-muted hover:text-foreground",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-8 rounded-none px-3 text-xs",
        lg: "h-11 rounded-none px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const styles = cn(buttonVariants({ variant, size, className }));
    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, { className: cn(styles, child.props.className) });
    }
    return <button ref={ref} className={styles} {...props}>{children}</button>;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
