"use client";

import { useEffect, useState } from "react";
import * as d3 from "d3";

export default function TimeUseChart() {
  // State
  const [timeUseData, setTimeUseData] = useState(null);
  const [selectedView, setSelectedView] = useState("overall");
  const [hoveredCategory, setHoveredCategory] = useState(null);

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
  const totalHours = selectedData
    ? d3.sum(selectedData, (item) => item.averageMinutes) / 60
    : 0;
  const dayWidthScale = d3.scaleLinear().domain([0, 1440]).range([0, 100]);
  const categoryColors = [
    "#8E7D8A", // muted mauve
    "#C58F7B", // dusty terracotta
    "#7F9E8A", // sage green
    "#D0B06F", // muted ochre
    "#6F8FAF", // dusty blue
    "#9C86B8", // soft purple
    "#D88C7A", // salmon
    "#6FA6A1", // teal
    "#B5946F", // warm tan
    "#8E8E8E", // gray
    "#9EBB7A", // olive green
    "#C47F98", // dusty rose
    "#6E8E83", // deep sage
    "#C9A66B", // golden tan
    "#7C91B6", // slate blue
    "#A97C73", // muted brick
    "#6F9BAA", // blue teal
    "#A97FA6", // plum
  ];

  const colorScale = d3
    .scaleOrdinal()
    .domain(timeUseData?.overall.map((item) => item.category) ?? [])
    .range(categoryColors);
  const widthScale = d3.scaleLinear().domain([0, maxMinutes]).range([0, 100]);

  // Page output
  return (
    <section>
      {timeUseData ? (
        <div>
          {/* View selector */}
          <div className="mt-6 flex w-fit gap-1 rounded-full bg-gray-100 p-1">
            <button
              className={`rounded-full px-4 py-2 text-sm ${
                selectedView === "overall"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black"
              }`}
              onClick={() => setSelectedView("overall")}
            >
              Overall
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm ${
                selectedView === "weekday"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black"
              }`}
              onClick={() => setSelectedView("weekday")}
            >
              Weekday
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm ${
                selectedView === "weekend"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black"
              }`}
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
          <p>Total hours: {totalHours}</p>

          {/* 24-hour ribbon */}
          <div className="mt-6 flex h-12 max-w-3xl overflow-hidden rounded-full bg-gray-100">
            {selectedData.map((item) => (
              <div
                key={item.category}
                className="h-full"
                onMouseEnter={() => setHoveredCategory(item.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  width: `${dayWidthScale(item.averageMinutes)}%`,
                  backgroundColor: colorScale(item.category),
                }}
              />
            ))}
          </div>

          {/* Bar chart */}
          <div className="mt-6 max-w-3xl">
            {selectedData.map((item) => (
              <div
                key={item.category}
                className={`mb-4 rounded-lg p-2 transition ${
                  hoveredCategory === item.category ? "bg-gray-100" : ""
                }`}
              >
                <div className="mb-1 flex justify-between gap-4 text-sm">
                  <span>{item.category}</span>
                  <span>{item.averageMinutes} minutes</span>
                </div>

                <div className="h-5 rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${widthScale(item.averageMinutes)}%`,
                      backgroundColor: colorScale(item.category),
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
