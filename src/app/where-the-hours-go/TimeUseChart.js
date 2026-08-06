"use client";

import { useEffect, useState } from "react";

export default function TimeUseChart() {
  // State
  const [timeUseData, setTimeUseData] = useState(null);
  const [selectedView, setSelectedView] = useState("overall");

  // Load process time-use data
  useEffect(() => {
    fetch("/data/where-the-hours-go/time-use-averages.json")
      .then((response) => response.json())
      .then((data) => {
        setTimeUseData(data);
      });
  }, []);

  // Select the active dataset
  const selectedData = timeUseData?.[selectedView];

  // Page output
  return (
    <section>
      {timeUseData ? (
        <div>
          {/* View selector */}
          <div>
            <button onClick={() => setSelectedView("overall")}>Overall</button>
            <button onClick={() => setSelectedView("weekday")}>Weekday</button>
            <button onClick={() => setSelectedView("weekend")}>Weekend</button>
          </div>
          {/* Temporary data checks */}
          <p>Selected view: {selectedView}</p>
          <p>Categories in this view: {selectedData.length}</p>
        </div>
      ) : (
        <p>Loading visualization data...</p>
      )}
    </section>
  );
}
