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
          <div className="mt-6 flex w-fit gap-1 rounded-full bg-gray-100 p-1">
            <button
              className="rounded-full px-4 py-2 text-sm"
              onClick={() => setSelectedView("overall")}
            >
              Overall
            </button>
            <button
              className="rounded-full px-4 py-2 text-sm"
              onClick={() => setSelectedView("weekday")}
            >
              Weekday
            </button>
            <button
              className="rounded-full px-4 py-2 text-sm"
              onClick={() => setSelectedView("weekend")}
            >
              Weekend
            </button>
          </div>

          {/* Category definition */}
          <p className="mt-4 max-w-3xl text-sm text-gray-600">
            Personal care includes sleeping, grooming, health-related self-care,
            and other private personal activities.
          </p>
          {/* Temporary data checks */}
          <p>Selected view: {selectedView}</p>
          <p>Categories in this view: {selectedData.length}</p>
          <p>Largest category: {maxMinutes} minutes</p>

          {/* Bar chart */}
          <div className="mt-6 max-w-3xl">
            {selectedData.map((item) => (
              <div key={item.category} className="mb-4">
                <div className="mb-1 flex justify-between gap-4 text-cm">
                  <span>{item.category}</span>
                  <span>{item.averageMinutes} minutes</span>
                </div>

                <div className="h-5 rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-black"
                    style={{
                      width: `${widthScale(item.averageMinutes)}%`,
                    }}
                  />
                </div>
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
