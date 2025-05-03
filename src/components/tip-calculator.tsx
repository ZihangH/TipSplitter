
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DollarSign, Percent, Users, RefreshCw, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription as FormDescriptionPrimitive, // Alias to avoid naming conflict
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  billAmount: z.coerce.number().min(0.01, "Bill amount must be positive"),
  tipPercentage: z.coerce.number().min(0, "Tip % cannot be negative").max(100, "Tip % cannot exceed 100"),
  numberOfPeople: z.coerce.number().int().min(1, "Must be at least 1 person"),
  country: z.enum(["us", "ca"]).default("us"),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100").optional().default(0),
  roundUp: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface CalculationResult {
  taxAmount: number;
  tipAmount: number;
  totalAmount: number;
  amountPerPerson: number;
  originalAmountPerPerson: number; // Store original before rounding
}

// Renamed component to avoid conflict with ShadCN FormDescription
const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-xs text-muted-foreground", className)} // Use text-xs for descriptions
      {...props}
    />
  );
});
FieldDescription.displayName = "FieldDescription";


export default function TipCalculator() {
  const [result, setResult] = React.useState<CalculationResult | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billAmount: undefined, // Use undefined for placeholder visibility
      tipPercentage: 15,
      numberOfPeople: 1,
      country: "us",
      taxRate: 0,
      roundUp: false,
    },
  });

  const { watch, reset, formState: { errors } } = form;
  const roundUp = watch("roundUp");
  const billAmount = watch("billAmount");
  const tipPercentage = watch("tipPercentage");
  const numberOfPeople = watch("numberOfPeople");
  const country = watch("country");
  const taxRate = watch("taxRate");


  const calculateTip = React.useCallback((data: FormData): CalculationResult | null => {
    const { billAmount, tipPercentage, numberOfPeople, country, taxRate = 0, roundUp } = data;

    if (!billAmount || tipPercentage === undefined || !numberOfPeople) return null; // tip can be 0

    const taxDecimal = taxRate / 100;
    const taxAmount = billAmount * taxDecimal;

    let baseForTip: number;
    if (country === 'ca') {
      // Canada: Tip on bill amount + tax
      baseForTip = billAmount + taxAmount;
    } else {
      // US (default): Tip on bill amount only
      baseForTip = billAmount;
    }

    const tipDecimal = tipPercentage / 100;
    const tipAmount = baseForTip * tipDecimal;
    const totalAmount = billAmount + taxAmount + tipAmount;
    const originalAmountPerPerson = totalAmount / numberOfPeople;

    let finalAmountPerPerson = originalAmountPerPerson;
    if (roundUp) {
      finalAmountPerPerson = Math.ceil(originalAmountPerPerson);
    }

    return {
      taxAmount,
      tipAmount,
      totalAmount,
      amountPerPerson: finalAmountPerPerson,
      originalAmountPerPerson,
    };
  }, []);


  // Recalculate whenever form values change and are valid
  React.useEffect(() => {
    const subscription = watch((values) => {
       const parsed = formSchema.safeParse(values);
       if(parsed.success) {
         const calculation = calculateTip(parsed.data);
         setResult(calculation);
       } else {
         // Clear results if form is invalid, but don't reset fields
         setResult(null);
       }
    });
    return () => subscription.unsubscribe();
  }, [watch, formSchema, calculateTip]);


  const handleReset = () => {
    reset({
      billAmount: undefined,
      tipPercentage: 15,
      numberOfPeople: 1,
      country: "us",
      taxRate: 0,
      roundUp: false,
    });
    setResult(null);
    toast({
      title: "Calculator Reset",
      description: "All fields have been cleared.",
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || isNaN(amount)) {
        // Return empty string or placeholder if needed when invalid/undefined
        return '---';
    }
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD", // Keep as USD for display consistency, value is numerical
    });
  };


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl text-secondary-foreground">Calculate Your Tip & Split</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter details below to calculate tax, tip, and split the bill.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            {/* Bill Amount */}
            <FormField
              control={form.control}
              name="billAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Amount</FormLabel>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        className="pl-8"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        value={field.value ?? ''}
                         aria-invalid={!!errors.billAmount}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country Selection */}
             <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Country (for Tax/Tip Rules)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="us" id="us"/>
                        </FormControl>
                        <Label htmlFor="us" className="font-normal">United States (Tip on pre-tax amount)</Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ca" id="ca"/>
                        </FormControl>
                         <Label htmlFor="ca" className="font-normal">Canada (Tip on post-tax amount)</Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tax Rate */}
            <FormField
              control={form.control}
              name="taxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales Tax Rate (%)</FormLabel>
                  <div className="relative">
                     <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.01"
                        className="pl-8"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                         value={field.value ?? ''}
                          aria-invalid={!!errors.taxRate}
                      />
                    </FormControl>
                  </div>
                   <FieldDescription>
                    Enter the sales tax rate (e.g., 7 for 7%). Leave as 0 if no tax applies.
                  </FieldDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tip Percentage */}
            <FormField
              control={form.control}
              name="tipPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tip Percentage</FormLabel>
                  <div className="relative">
                     <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="15"
                        min="0"
                        max="100"
                         className="pl-8"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                         value={field.value ?? ''}
                          aria-invalid={!!errors.tipPercentage}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Number of People */}
            <FormField
              control={form.control}
              name="numberOfPeople"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of People</FormLabel>
                   <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        min="1"
                        step="1"
                         className="pl-8"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                        value={field.value ?? ''}
                         aria-invalid={!!errors.numberOfPeople}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Round Up Switch */}
             <FormField
              control={form.control}
              name="roundUp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-secondary">
                  <div className="space-y-0.5">
                    <FormLabel>Round Up Total Per Person?</FormLabel>
                     <FieldDescription>
                       Each person's share will be rounded up to the nearest dollar.
                    </FieldDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

             <Separator className="my-6" />

            {/* Calculation Results */}
            <div className="space-y-3 rounded-lg border border-input p-4 bg-secondary/50">
               <h3 className="text-lg font-semibold text-center text-secondary-foreground mb-3">Results</h3>
               {/* Tax Amount */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tax Amount ({taxRate ?? 0}%):</span>
                <span className="font-medium text-primary-foreground">{formatCurrency(result?.taxAmount)}</span>
              </div>
               <Separator className="my-1 bg-border/50"/>
               {/* Tip Amount */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tip Amount ({tipPercentage ?? 0}%):</span>
                <span className="font-medium text-primary-foreground">{formatCurrency(result?.tipAmount)}</span>
              </div>
               <Separator className="my-1 bg-border/50"/>
                {/* Total Bill */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Bill (incl. Tax & Tip):</span>
                <span className="font-medium text-primary-foreground">{formatCurrency(result?.totalAmount)}</span>
              </div>
                <Separator className="my-1 bg-border/50"/>
                 {/* Amount Per Person */}
              <div className="flex justify-between items-center mt-3">
                <span className="text-muted-foreground font-semibold">Amount Per Person:</span>
                <span className="font-semibold text-xl text-accent-foreground bg-accent px-3 py-1 rounded-md">{formatCurrency(result?.amountPerPerson)}</span>
              </div>
               {roundUp && result && result.amountPerPerson > result.originalAmountPerPerson && (
                 <p className="text-xs text-muted-foreground text-center pt-1">
                   (Original: {formatCurrency(result.originalAmountPerPerson)} per person)
                 </p>
               )}
                {/* Validation/Placeholder Messages */}
                 {!result && billAmount && tipPercentage !== undefined && numberOfPeople && (
                   <p className="text-sm text-destructive text-center pt-2">Please ensure all inputs are valid numbers.</p>
                 )}
                   {(!billAmount || tipPercentage === undefined || !numberOfPeople) && !Object.keys(errors).length && (
                     <p className="text-sm text-muted-foreground text-center pt-2">Enter bill details above to calculate.</p>
                   )}
                    {!!Object.keys(errors).length && (
                       <p className="text-sm text-destructive text-center pt-2">Please fix the errors above.</p>
                    )}
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-end">
         <Button variant="outline" onClick={handleReset} className="gap-1">
           <RefreshCw className="h-4 w-4" />
           Reset
        </Button>
      </CardFooter>
    </Card>
  );
}

    