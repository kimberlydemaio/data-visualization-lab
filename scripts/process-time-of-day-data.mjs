import fs from "fs";
import path from "path";
import * as d3 from "d3";

// File paths
const activityFile = path.join(
  process.cwd(),
  "data-source",
  "where-the-hours-go",
  "atusact_2025.dat",
);

const summaryFile = path.join(
  process.cwd(),
  "data-source",
  "where-the-hours-go",
  "atussum_2025.dat",
);

const outputFile = path.join(
  process.cwd(),
  "public",
  "data",
  "where-the-hours-go",
  "weekly-time-of-day.json",
);

// Activity category names
const categoryNames = {
  "01": "Personal care",
  "02": "Household activities",
  "03": "Caring for household members",
  "04": "Caring for nonhousehold members",
  "05": "Work and work-related activities",
  "06": "Education",
  "07": "Consumer purchases",
  "08": "Professional and personal care services",
  "09": "Household services",
  "10": "Government services and civic obligations",
  "11": "Eating and drinking",
  "12": "Socializing, relaxing, and leisure",
  "13": "Sports, exercise, and recreation",
  "14": "Religious and spiritual activities",
  "15": "Volunteer activities",
  "16": "Telephone calls",
  "18": "Traveling",
  "50": "Data codes and uncodable activities",
};

// ATUS diary-day codes
const dayNames = {
  1: "Sunday",
  2: "Monday",
  3: "Tuesday",
  4: "Wednesday",
  5: "Thursday",
  6: "Friday",
  7: "Saturday",
};

// Our reel runs Monday → Sunday
const weekDayOrder = [2, 3, 4, 5, 6, 7, 1];

const weekDayIndex = new Map(
  weekDayOrder.map((dayCode, index) => [dayCode, index]),
);

// Read and parse source files
const activityText = fs.readFileSync(activityFile, "utf8");
const summaryText = fs.readFileSync(summaryFile, "utf8");

const activityRows = d3.csvParse(activityText);
const summaryRows = d3.csvParse(summaryText);

console.log(`Activity rows: ${activityRows.length}`);
console.log(`Summary rows: ${summaryRows.length}`);

// Build respondent lookup
const summaryByCaseId = new Map(
  summaryRows.map((row) => [
    row.TUCASEID,
    {
      weight: Number(row.TUFINLWGT),
      diaryDay: Number(row.TUDIARYDAY),
    },
  ]),
);

// Format minutes after midnight as a readable clock time
function formatClockTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const hour12 = hours % 12 || 12;
  const period = hours < 12 ? "AM" : "PM";

  return `${hour12}:${String(mins).padStart(2, "0")} ${period}`;
}

// Calculate how much of an activity falls inside a 15-minute bucket
function getOverlapMinutes(activity, bucketStart) {
  const bucketEnd = bucketStart + 15;

  const overlapStart = Math.max(activity.startMinutes, bucketStart);
  const overlapEnd = Math.min(activity.stopMinutes, bucketEnd);

  return Math.max(0, overlapEnd - overlapStart);
}

// Convert the ATUS diary day into the true calendar day
function getCalendarDayCode(diaryDay, bucketStart) {
  // ATUS diaries run from 4 AM to 4 AM.
  // Minutes 1200–1440 represent midnight–4 AM on the following day.
  if (bucketStart < 1200) {
    return diaryDay;
  }

  return diaryDay === 7 ? 1 : diaryDay + 1;
}

// Calculate weighted category shares for one day/time bucket
function calculateCategoryShares(activities) {
  const activitiesByCategory = d3.group(
    activities,
    (activity) => activity.category,
  );

  const categoryTotals = Array.from(
    activitiesByCategory,
    ([category, categoryActivities]) => ({
      category,
      weightedMinutes: d3.sum(
        categoryActivities,
        (activity) => activity.overlapMinutes * activity.weight,
      ),
    }),
  );

  const totalWeightedMinutes = d3.sum(
    categoryTotals,
    (item) => item.weightedMinutes,
  );

  return categoryTotals
    .map((item) => ({
      category: categoryNames[item.category] ?? item.category,
      percent:
        totalWeightedMinutes > 0
          ? (item.weightedMinutes / totalWeightedMinutes) * 100
          : 0,
    }))
    .sort((a, b) => b.percent - a.percent)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

// Create the 96 fifteen-minute positions in an ATUS diary day
const timeBuckets = d3.range(0, 1440, 15);

// Join activity episodes to respondent weights and diary days
const joinedActivities = activityRows.map((row) => {
  const summary = summaryByCaseId.get(row.TUCASEID);

  const durationMinutes = Number(row.TUACTDUR24);
  const stopMinutes = Number(row.TUCUMDUR24);
  const startMinutes = stopMinutes - durationMinutes;

  return {
    caseId: row.TUCASEID,
    category: row.TUTIER1CODE,
    startMinutes,
    stopMinutes,
    weight: summary?.weight ?? 0,
    diaryDay: summary?.diaryDay ?? null,
  };
});

// Build the continuous Monday → Sunday reel
const weeklyData = [];

for (const bucketStart of timeBuckets) {
  const clockMinutes = (bucketStart + 240) % 1440;

  const activitiesInBucket = joinedActivities
    .map((activity) => {
      const overlapMinutes = getOverlapMinutes(activity, bucketStart);

      if (overlapMinutes <= 0) {
        return null;
      }

      return {
        ...activity,
        overlapMinutes,
        calendarDay: getCalendarDayCode(
          activity.diaryDay,
          bucketStart,
        ),
      };
    })
    .filter(Boolean);

  const activitiesByDay = d3.group(
    activitiesInBucket,
    (activity) => activity.calendarDay,
  );

  for (const dayCode of weekDayOrder) {
    const dayActivities = activitiesByDay.get(dayCode) ?? [];
    const dayIndex = weekDayIndex.get(dayCode);

    const categories = calculateCategoryShares(dayActivities);

    weeklyData.push({
      frameIndex: dayIndex * 96 + clockMinutes / 15,
      weekMinute: dayIndex * 1440 + clockMinutes,
      dayCode,
      dayName: dayNames[dayCode],
      clockMinutes,
      timeLabel: formatClockTime(clockMinutes),
      period: clockMinutes < 720 ? "AM" : "PM",
      categories,
    });
  }
}

// Put all 672 frames into chronological reel order
weeklyData.sort((a, b) => a.frameIndex - b.frameIndex);

// Write browser-ready data
fs.writeFileSync(
  outputFile,
  JSON.stringify(weeklyData, null, 2),
);

console.log(`Weekly frames: ${weeklyData.length}`);
console.log(`First frame: ${weeklyData[0].dayName} ${weeklyData[0].timeLabel}`);
console.log(
  `Last frame: ${weeklyData.at(-1).dayName} ${weeklyData.at(-1).timeLabel}`,
);
console.log(`Wrote processed weekly data to ${outputFile}`);