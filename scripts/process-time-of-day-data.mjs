import fs from "fs";
import path from "path";
import * as d3 from "d3";

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
  "time-of-day.json",
);

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
  10: "Government services and civic obligations",
  11: "Eating and drinking",
  12: "Socializing, relaxing, and leisure",
  13: "Sports, exercise, and recreation",
  14: "Religious and spiritual activities",
  15: "Volunteer activities",
  16: "Telephone calls",
  18: "Traveling",
  50: "Data codes and uncodable activities",
};

const activityText = fs.readFileSync(activityFile, "utf8");
const summaryText = fs.readFileSync(summaryFile, "utf8");

const activityRows = d3.csvParse(activityText);
const summaryRows = d3.csvParse(summaryText);

console.log(`Activity rows: ${activityRows.length}`);
console.log(`Summary rows: ${summaryRows.length}`);

const summaryByCaseId = new Map(
  summaryRows.map((row) => [
    row.TUCASEID,
    {
      weight: Number(row.TUFINLWGT),
      diaryDay: Number(row.TUDIARYDAY),
    },
  ]),
);

function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);

  return hours * 60 + minutes;
}

function formatClockTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const hour12 = hours % 12 || 12;
  const period = hours < 12 ? "AM" : "PM";

  return `${hour12}:${String(mins).padStart(2, "0")} ${period}`;
}

function getOverlapMinutes(activity, bucketStart) {
  const bucketEnd = bucketStart + 15;

  const overlapStart = Math.max(activity.startMinutes, bucketStart);
  const overlapEnd = Math.min(activity.stopMinutes, bucketEnd);

  return Math.max(0, overlapEnd - overlapStart);
}

const timeBuckets = d3.range(0, 1440, 15);

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

const bucketedData = timeBuckets.map((bucketStart) => {
  const activitiesInBucket = joinedActivities
    .map((activity) => ({
      ...activity,
      overlapMinutes: getOverlapMinutes(activity, bucketStart),
    }))
    .filter((activity) => activity.overlapMinutes > 0);

  const activitiesByCategory = d3.group(
    activitiesInBucket,
    (activity) => activity.category,
  );

  const categoryTotals = Array.from(
    activitiesByCategory,
    ([category, activities]) => ({
      category,
      weightedMinutes: d3.sum(
        activities,
        (activity) => activity.overlapMinutes * activity.weight,
      ),
    }),
  );

  const totalWeightedMinutes = d3.sum(
    categoryTotals,
    (item) => item.weightedMinutes,
  );

  const categoryShares = categoryTotals.map((item) => ({
    category: categoryNames[item.category] ?? item.category,
    percent:
      totalWeightedMinutes > 0
        ? (item.weightedMinutes / totalWeightedMinutes) * 100
        : 0,
  }));

  return {
    bucketStart,
    categories: categoryShares,
  };
});

const clockData = bucketedData.map((bucket) => {
  const clockMinutes = (bucket.bucketStart + 240) % 1440;

  return {
    ...bucket,
    clockMinutes,
    timeLabel: formatClockTime(clockMinutes),
  };
});

clockData.sort((a, b) => a.clockMinutes - b.clockMinutes);

fs.writeFileSync(outputFile, JSON.stringify(clockData, null, 2));

console.log(`Wrote processed clock data to ${outputFile}`);
