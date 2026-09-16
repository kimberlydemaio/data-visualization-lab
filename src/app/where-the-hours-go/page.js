import TimeUseChart from "./TimeUseChart";

export default function WhereTheHoursGoPage() {
  return (
    <main className="min-h-screen bg-[#F1EFE9] px-6 py-8 text-[#25231F]">
      <p className="text-xs uppercase tracking-[0.2em] text-[#777168]">
        American Time Use Survey · 2025
      </p>

      <h1 className="mt-2 text-4xl font-medium tracking-tight">
        Where the Hours Go
      </h1>

      <p className="mt-3 max-w-2xl text-base leading-7 text-[#5F5A52]">
        A week in American life, told hour by hour. Each ring follows the most
        common activities across a 12-hour period, from the most common activity
        on the outside inward.
      </p>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#777168]">
        Choose a day and AM or PM, click or drag the clock hand to explore a
        moment, or press Play to watch the week unfold.
      </p>

      <TimeUseChart />
    </main>
  );
}
