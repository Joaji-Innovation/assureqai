"use client";

import type { ReactNode, ElementType } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OverviewCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footerText?: string;
  footerAction?: () => void; // Changed to a generic function
  icon?: ElementType;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  onClick?: () => void;
}

export function OverviewCard({
  title,
  description,
  children,
  footerText,
  footerAction,
  icon: Icon,
  className,
  titleClassName,
  descriptionClassName,
  contentClassName,
  headerClassName,
  footerClassName,
  onClick,
}: OverviewCardProps) {
  return (
    <Card
      className={cn("shadow-lg flex flex-col", className)}
      onClick={onClick}
    >
      <CardHeader className={cn("pb-4", headerClassName)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            <CardTitle className={cn("text-lg font-semibold", titleClassName)}>
              {title}
            </CardTitle>
          </div>
          {/* Optional: Add actions like a dropdown menu here */}
        </div>
        {description && (
          <CardDescription className={cn(descriptionClassName)}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn("flex-grow", contentClassName)}>
        {children}
      </CardContent>
      {footerText &&
        footerAction && ( // Ensure footerAction is present to render the button
          <CardFooter className={cn("pt-4", footerClassName)}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:bg-primary/10"
              onClick={footerAction}
            >
              {footerText}
            </Button>
          </CardFooter>
        )}
    </Card>
  );
}
