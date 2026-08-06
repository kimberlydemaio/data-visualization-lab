"use client";

import { useEffect, useState } from "react";

export default function TimeUseChart() {
  const [timeUseData, setTimeUseData] = useState(null);
  useEffect(() => {
    fetch("/data/where-the-hours-go/time-use-averages.json")
      .then((response) => response.json())
      .then((data) => {
        setTimeUseData(data);
      });
  }, []);

  return (
    <section>
      {timeUseData ? (
        <div>
          <p>Overall categories: {timeUseData.overall.length}</p>
          <p>Weekday categories: {timeUseData.weekday.length}</p>
          <p>Weekend categories: {timeUseData.weekend.length}</p>
        </div>
      ) : (
        <p>Loading visualization data...</p>
      )}
    </section>
  );
}
