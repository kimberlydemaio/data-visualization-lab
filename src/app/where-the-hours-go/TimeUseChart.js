"use client";

import { useEffect, useState } from "react";
import * as d3 from "d3";

export default function TimeUseChart() {
  // State
  const [timeUseData, setTimeUseData] = useState([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Load processed weekly time-use data
  useEffect(() => {
    fetch("/data/where-the-hours-go/weekly-time-of-day.json")
      .then((response) => response.json())
      .then((data) => {
        setTimeUseData(data);
      });
  }, []);

  useEffect(() => {
    if (!isPlaying || timeUseData.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setSelectedFrameIndex((current) => {
        return (current + 1) % timeUseData.length;
      });
    }, 400 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, timeUseData.length, playbackSpeed]);

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
      <div className="mt-8 rounded-[28px] border border-[#B8AFA3] bg-[#F7F4EE] p-8 lg:p-10">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          {/* Left column: clock */}
          <div className="flex justify-center">
            <div
              className="relative aspect-square w-full max-w-xl cursor-pointer rounded-full border border-[#544A3F]"
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

                <circle
                  cx="300"
                  cy="300"
                  r="278"
                  fill="none"
                  stroke="#8A7967"
                  strokeWidth="1"
                  strokeOpacity="0.45"
                />

                {/* Clock tick marks */}
                {d3.range(60).map((tick) => {
                  if ([0, 15, 30, 45].includes(tick)) {
                    return null;
                  }

                  const angle = (tick / 60) * Math.PI * 2;
                  const isHour = tick % 5 === 0;

                  const outerRadius = 272;
                  const innerRadius = isHour ? 258 : 264;

                  const x1 = 300 + Math.sin(angle) * innerRadius;
                  const y1 = 300 - Math.cos(angle) * innerRadius;

                  const x2 = 300 + Math.sin(angle) * outerRadius;
                  const y2 = 300 - Math.cos(angle) * outerRadius;

                  return (
                    <line
                      key={tick}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#5E5951"
                      strokeWidth={isHour ? 1.2 : 0.6}
                      strokeOpacity={isHour ? 0.38 : 0.18}
                    />
                  );
                })}

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

              <span className="absolute left-1/2 top-[3.5%] z-10 -translate-x-1/2 font-serif text-2xl font-semibold tracking-wide text-[#2C241D]">
                12
              </span>

              <span className="absolute right-[3.5%] top-1/2 z-10 -translate-y-1/2 font-serif text-2xl font-semibold tracking-wide text-[#2C241D]">
                3
              </span>

              <span className="absolute bottom-[3.5%] left-1/2 z-10 -translate-x-1/2 font-serif text-2xl font-semibold tracking-wide text-[#2C241D]">
                6
              </span>

              <span className="absolute left-[3.5%] top-1/2 z-10 -translate-y-1/2 font-serif text-2xl font-semibold tracking-wide text-[#2C241D]">
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
              <div className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3F3A34] bg-[#F1EFE9]" />
              <div
                className="absolute left-1/2 top-1/2 h-[34%] w-[2px] origin-bottom bg-[#7A5C43] transition-transform duration-300 ease-out"
                style={{
                  transform: `translate(-50%, -100%) rotate(${handAngle}deg)`,
                }}
              />
            </div>
          </div>

          {/* Right column: selected moment */}
          <div className="lg:border-l lg:border-[#C9C1B6] lg:pl-10">
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
      </div>

      {/* Category definition */}
      <p className="mt-8 max-w-3xl text-sm text-gray-600">
        Personal care includes sleeping, grooming, health-related self-care, and
        other private personal activities.
      </p>
      <p className="mt-2 text-xs text-[#777168]">
        Source:{" "}
        <a
          href="https://www.bls.gov/tus/data/datafiles-2025.htm"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[#A69D91] underline-offset-4 transition hover:text-[#25231F]"
        >
          U.S. Bureau of Labor Statistics, American Time Use Survey 2025
        </a>
      </p>
      {/* Play controls */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="flex items-center gap-3 rounded-full border border-[#4B4740] px-6 py-3 text-sm uppercase tracking-[0.14em] transition hover:bg-[#25231F] hover:text-[#F1EFE9]"
          onClick={() => setIsPlaying((current) => !current)}
        >
          <span aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span>

          {isPlaying ? "Pause" : "Play the week"}
        </button>

        <div className="flex rounded-full border border-[#B8B1A7] p-1">
          {[1, 1.5, 2].map((speed) => (
            <button
              key={speed}
              type="button"
              className={`rounded-full px-3 py-2 text-xs transition ${
                playbackSpeed === speed
                  ? "bg-[#25231F] text-[#F1EFE9]"
                  : "text-[#625D55] hover:text-[#25231F]"
              }`}
              onClick={() => setPlaybackSpeed(speed)}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
