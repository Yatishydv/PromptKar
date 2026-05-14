import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
}

export const Card = ({ className, hoverable = true, glass = false, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "bg-white border border-slate-100 rounded-[2rem] shadow-soft transition-all duration-300",
        hoverable && "hover:shadow-premium hover:border-slate-200",
        glass && "bg-white/10 backdrop-blur-md border-white/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-8 pb-0", className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-xl font-bold text-slate-900", className)} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-8", className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-8 pt-0 mt-auto", className)} {...props}>
    {children}
  </div>
);
