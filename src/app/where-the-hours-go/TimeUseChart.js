"use client";

import { useEffect, useState } from "react";
import * as d3 from "d3";

export default function TimeUseChart() {
  // State
  const [timeUseData, setTimeUseData] = useState([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load processed weekly time-use data
  useEffect(() => {
    fetch("/data/where-the-hours-go/weekly-time-of-day.json")
      .then((response) => response.json())
      .then((data) => {
        setTimeUseData(data);
      });
  }, []);

  // Select the active frame from the weekly reel
  const selectedData = timeUseData[selectedFrameIndex];

  const selectedHalfDayFrames = timeUseData.filter(
    (frame) =>
      frame.dayName === selectedData?.dayName &&
      frame.period === selectedData?.period,
  );

  // Muted category palette
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

  const categoryNames = [
    "Personal care",
    "Household activities",
    "Caring for household members",
    "Caring for nonhousehold members",
    "Work and work-related activities",
    "Education",
    "Consumer purchases",
    "Professional and personal care services",
    "Household services",
    "Government services and civic obligations",
    "Eating and drinking",
    "Socializing, relaxing, and leisure",
    "Sports, exercise, and recreation",
    "Religious and spiritual activities",
    "Volunteer activities",
    "Telephone calls",
    "Traveling",
    "Data codes and uncodable activities",
  ];

  const colorScale = d3
    .scaleOrdinal()
    .domain(categoryNames)
    .range(categoryColors);

  // Loading state
  if (!selectedData) {
    return (
      <section>
        <p>Loading visualization data...</p>
      </section>
    );
  }

  const handAngle = (selectedData.weekMinute / 720) * 360;

  function updateClockFromPointer(event) {
    const clock = event.currentTarget;
    const rect = clock.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = event.clientX - centerX;
    const y = event.clientY - centerY;

    let pointerAngle = Math.atan2(x, -y) * (180 / Math.PI);

    if (pointerAngle < 0) {
      pointerAngle += 360;
    }

    setSelectedFrameIndex((currentIndex) => {
      const currentFrame = timeUseData[currentIndex];

      if (!currentFrame) {
        return currentIndex;
      }

      const currentAngle = ((currentFrame.clockMinutes % 720) / 720) * 360;

      let angleDifference = pointerAngle - currentAngle;

      // Handle crossing the 12 o'clock boundary.
      if (angleDifference > 180) {
        angleDifference -= 360;
      }

      if (angleDifference < -180) {
        angleDifference += 360;
      }

      const frameDifference = Math.round(angleDifference / 7.5);

      const nextIndex = currentIndex + frameDifference;

      return (nextIndex + timeUseData.length) % timeUseData.length;
    });
  }

  function handleClockClick(event) {
    updateClockFromPointer(event);
  }

  // Page output
  return (
    <section className="mt-8">
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        {/* Left column: clock */}
        <div className="flex justify-center">
          <div
            className="relative aspect-square w-full max-w-xl cursor-pointer rounded-full border border-gray-700"
            onClick={handleClockClick}
            onPointerDown={(event) => {
              setIsDragging(true);
              event.currentTarget.setPointerCapture(event.pointerId);
              updateClockFromPointer(event);
            }}
            onPointerMove={(event) => {
              if (isDragging) {
                updateClockFromPointer(event);
              }
            }}
            onPointerUp={(event) => {
              setIsDragging(false);
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => {
              setIsDragging(false);
            }}
          >
            {/* SVG layer for activity ribbons */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 600 600"
              aria-hidden="true"
            >
              {/* Inner guide circle */}
              <circle
                cx="300"
                cy="300"
                r="250"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.12"
              />

              {/* Ranked activity rings */}
              {[0, 1, 2, 3, 4].map((rankIndex) => {
                const outerRadius = 245 - rankIndex * 35;
                const innerRadius = outerRadius - 30;

                return selectedHalfDayFrames.map((frame, index) => {
                  const activity = frame.categories[rankIndex];

                  if (!activity) {
                    return null;
                  }

                  const segmentPadding = 0.012;

                  const startAngle =
                    (index / 48) * Math.PI * 2 - segmentPadding;

                  const endAngle =
                    ((index + 1) / 48) * Math.PI * 2 + segmentPadding;

                  const arcPath = d3
                    .arc()
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius)
                    .startAngle(startAngle)
                    .endAngle(endAngle)();

                  return (
                    <path
                      key={`rank-${rankIndex + 1}-${frame.frameIndex}`}
                      d={arcPath}
                      transform="translate(300 300)"
                      fill={colorScale(activity.category)}
                      opacity={0.74 - rankIndex * 0.08}
                      style={{
                        transition: "fill 300ms ease, opacity 300ms ease",
                      }}
                    />
                  );
                });
              })}
            </svg>

            <path
              d={d3
                .arc()
                .innerRadius(210)
                .outerRadius(245)
                .startAngle(0)
                .endAngle(
                  (selectedData.categories[0].percent / 100) * Math.PI * 2,
                )({
                innerRadius: 210,
                outerRadius: 245,
                startAngle: 0,
                endAngle:
                  (selectedData.categories[0].percent / 100) * Math.PI * 2,
              })}
              transform="translate(300 300)"
              fill={colorScale(selectedData.categories[0].category)}
              opacity="0.75"
            />
            <span className="absolute left-1/2 top-4 -translate-x-1/2 text-sm">
              12
            </span>

            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">
              3
            </span>

            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm">
              6
            </span>

            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm">
              9
            </span>

            {/* Selected 15-minute point */}
            <div
              className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-white/70"
              style={{
                transform: `translate(-50%, -50%) rotate(${handAngle}deg) translateY(-220px)`,
              }}
            />

            {/* Center pivot */}
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            <div
              className="absolute left-1/2 top-1/2 h-1/3 w-px origin-bottom bg-white transition-transform duration-300 ease-out"
              style={{
                transform: `translate(-50%, -100%) rotate(${handAngle}deg)`,
              }}
            />
          </div>
        </div>

        {/* Right column: selected moment */}
        <div>
          {/* Jump controls */}
          <div className="mb-6 flex flex-wrap gap-3">
            <select
              className="rounded-full border border-gray-700 bg-transparent px-4 py-2 text-sm"
              value={selectedData.dayName}
              onChange={(event) => {
                const day = event.target.value;

                const matchingFrame = timeUseData.find(
                  (frame) =>
                    frame.dayName === day &&
                    frame.period === selectedData.period &&
                    frame.clockMinutes === selectedData.clockMinutes,
                );

                if (matchingFrame) {
                  setSelectedFrameIndex(matchingFrame.frameIndex);
                }
              }}
            >
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>

            <select
              className="rounded-full border border-gray-700 bg-transparent px-4 py-2 text-sm"
              value={selectedData.period}
              onChange={(event) => {
                const period = event.target.value;

                const matchingFrame = timeUseData.find(
                  (frame) =>
                    frame.dayName === selectedData.dayName &&
                    frame.period === period &&
                    frame.clockMinutes % 720 ===
                      selectedData.clockMinutes % 720,
                );

                if (matchingFrame) {
                  setSelectedFrameIndex(matchingFrame.frameIndex);
                }
              }}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
          {/* Current frame */}
          <div>
            <p className="text-sm uppercase tracking-widest text-gray-500">
              {selectedData.dayName}
            </p>

            <h2 className="mt-1 text-4xl font-semibold">
              {selectedData.timeLabel}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Frame {selectedData.frameIndex + 1} of {timeUseData.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Frames in this clock: {selectedHalfDayFrames.length}
            </p>
          </div>

          {/* Most common activity */}
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-gray-500">
              Most common activity
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: colorScale(
                    selectedData.categories[0]?.category,
                  ),
                }}
              />

              <p className="text-lg font-medium">
                {selectedData.categories[0]?.category}
              </p>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {selectedData.categories[0]?.percent.toFixed(1)}%
            </p>
          </div>

          {/* Also happening */}
          <div className="mt-6 max-w-md">
            <p className="text-xs uppercase tracking-widest text-gray-500">
              Also happening
            </p>

            <div className="mt-3 space-y-2">
              {selectedData.categories.slice(1, 6).map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between gap-6 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: colorScale(item.category),
                      }}
                    />

                    <span>{item.category}</span>
                  </div>

                  <span className="text-gray-500">
                    {item.percent.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category definition */}
      <p className="mt-8 max-w-3xl text-sm text-gray-600">
        Personal care includes sleeping, grooming, health-related self-care, and
        other private personal activities.
      </p>

      {/* Temporary data check */}
      <div className="mt-6 max-w-3xl">
        <p className="text-sm text-gray-500">
          Categories in this frame: {selectedData.categories.length}
        </p>
      </div>

      {/* Ranked activity breakdown */}
      <div className="mt-6 max-w-3xl">
        {selectedData.categories.map((item) => (
          <div
            key={item.category}
            className={`mb-3 rounded-lg p-3 transition ${
              hoveredCategory === item.category ? "bg-gray-100" : ""
            }`}
            onMouseEnter={() => setHoveredCategory(item.category)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: colorScale(item.category),
                  }}
                />

                <span className="text-sm">
                  {item.rank}. {item.category}
                </span>
              </div>

              <span className="text-sm font-medium">
                {item.percent.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Temporary frame controls */}
      <div className="mt-8 flex gap-3">
        <button
          className="rounded-full border border-gray-300 px-4 py-2 text-sm disabled:opacity-40"
          onClick={() =>
            setSelectedFrameIndex((current) => Math.max(current - 1, 0))
          }
          disabled={selectedFrameIndex === 0}
        >
          Previous
        </button>

        <button
          className="rounded-full border border-gray-300 px-4 py-2 text-sm disabled:opacity-40"
          onClick={() =>
            setSelectedFrameIndex((current) =>
              Math.min(current + 1, timeUseData.length - 1),
            )
          }
          disabled={selectedFrameIndex === timeUseData.length - 1}
        >
          Next
        </button>
      </div>
    </section>
  );
}
