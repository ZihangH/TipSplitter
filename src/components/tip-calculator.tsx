"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DollarSign, Percent, Users, RefreshCw } from "lucide-react";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  billAmount: z.coerce.number().min(0.01, "Bill amount must be positive"),
  tipPercentage: z.coerce.number().min(0, "Tip % cannot be negative").max(100, "Tip % cannot exceed 100"),
  numberOfPeople: z.coerce.number().int().min(1, "Must be at least 1 person"),
  roundUp: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface CalculationResult {
  tipAmount: number;
  totalAmount: number;
  amountPerPerson: number;
  originalAmountPerPerson: number; // Store original before rounding
}

export default function TipCalculator() {
  const [result, setResult] = React.useState<CalculationResult | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billAmount: undefined, // Use undefined for placeholder visibility
      tipPercentage: 15,
      numberOfPeople: 1,
      roundUp: false,
    },
  });

  const { watch, reset } = form;
  const roundUp = watch("roundUp");
  const billAmount = watch("billAmount");
  const tipPercentage = watch("tipPercentage");
  const numberOfPeople = watch("numberOfPeople");


  const calculateTip = React.useCallback((data: FormData): CalculationResult | null => {
    const { billAmount, tipPercentage, numberOfPeople, roundUp } = data;

    if (!billAmount || !tipPercentage || !numberOfPeople) return null;

    const tipDecimal = tipPercentage / 100;
    const tipAmount = billAmount * tipDecimal;
    const totalAmount = billAmount + tipAmount;
    const originalAmountPerPerson = totalAmount / numberOfPeople;

    let finalAmountPerPerson = originalAmountPerPerson;
    if (roundUp) {
      finalAmountPerPerson = Math.ceil(originalAmountPerPerson);
    }

    return {
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
        return '$0.00';
    }
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl text-secondary-foreground">Calculate Your Tip</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter the details below to split the bill.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
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
                        className="pl-8"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                         className="pl-8"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                         value={field.value ?? ''}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        step="1"
                         className="pl-8"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="roundUp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-secondary">
                  <div className="space-y-0.5">
                    <FormLabel>Round Up Total Per Person?</FormLabel>
                     <p className="text-xs text-muted-foreground">
                       Each person's share will be rounded up to the nearest dollar.
                    </p>
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
            <div className="space-y-4 rounded-lg border border-input p-4 bg-secondary/50">
               <h3 className="text-lg font-semibold text-center text-secondary-foreground mb-3">Results</h3>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tip Amount:</span>
                <span className="font-medium text-primary-foreground">{formatCurrency(result?.tipAmount)}</span>
              </div>
               <Separator className="my-2 bg-border/50"/>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Bill:</span>
                <span className="font-medium text-primary-foreground">{formatCurrency(result?.totalAmount)}</span>
              </div>
                <Separator className="my-2 bg-border/50"/>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount Per Person:</span>
                <span className="font-semibold text-lg text-accent-foreground bg-accent px-2 py-1 rounded-md">{formatCurrency(result?.amountPerPerson)}</span>
              </div>
               {roundUp && result && result.amountPerPerson > result.originalAmountPerPerson && (
                 <p className="text-xs text-muted-foreground text-center pt-2">
                   Original amount per person: {formatCurrency(result.originalAmountPerPerson)}
                 </p>
               )}
                 {!result && billAmount && tipPercentage && numberOfPeople && (
                   <p className="text-sm text-destructive text-center pt-2">Please ensure all inputs are valid numbers.</p>
                 )}
                   {!billAmount || !tipPercentage || !numberOfPeople && (
                     <p className="text-sm text-muted-foreground text-center pt-2">Enter bill details above to calculate.</p>
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
