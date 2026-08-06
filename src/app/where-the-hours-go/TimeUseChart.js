"use client";

import { useEffect, useState } from "react";
import * as d3 from "d3";

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
  const maxMinutes = selectedData
    ? d3.max(selectedData, (item) => item.averageMinutes)
    : 0;
  const widthScale = d3.scaleLinear().domain([0, maxMinutes]).range([0, 100]);

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
          <p>Largest category: {maxMinutes} minutes</p>

          {/* Bar chart */}
          <div>
            {selectedData.map((item) => (
              <div key={item.category}>
                <p>
                  {item.category}: {item.averageMinutes} minutes
                </p>

                <div
                  style={{
                    width: `${widthScale(item.averageMinutes)}%`,
                    height: "20px",
                    backgroundColor: "black",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>Loading visualization data...</p>
      )}
    </section>
  );
}
