import TipCalculator from '@/components/tip-calculator';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-md">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 sm:mb-8 text-primary-foreground">
          TipSplitter
        </h1>
        <TipCalculator />
      </div>
    </main>
  );
}
