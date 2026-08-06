import TimeUseChart from "./TimeUseChart";

export default function WhereTheHoursGoPage() {
  return (
    <main className="px-6 py-8">
      <p>American Time Use Survey</p>

      <h1>Where the Hours Go</h1>

      <p>
        An interactive exploration of how work, care, rest, and daily life
        compete for the same 24 hours.
      </p>

      <TimeUseChart />
    </main>
  );
}
