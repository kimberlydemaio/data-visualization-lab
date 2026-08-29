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
    category: item.category,
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

const bucketTotals = bucketedData.map((bucket) => ({
  bucketStart: bucket.bucketStart,
  totalPercent: d3.sum(bucket.categories, (item) => item.percent),
}));

console.dir(bucketedData.slice(0, 2), { depth: null });
console.log(bucketTotals.slice(0, 4));
