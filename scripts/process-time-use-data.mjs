// Imports
import fs from "node:fs";
import path from "node:path";
import { csvParse } from "d3";

// Paths & Configs
const sourceFile = path.join(
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
  "time-use-averages.json",
);

const activityCategories = {
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
  50: "Unable to code",
};

// Read & Parse
const rawData = fs.readFileSync(sourceFile, "utf8");
const rows = csvParse(rawData);

const activityColumns = rows.columns.filter((column) =>
  /^t\d{6}$/.test(column),
);

console.log(`Loaded ${rows.length} respondents.`);

console.log(`Found ${activityColumns.length} activity columns.`);

// Helper functions
function getCategoryMinutes(row, categoryCode) {
  return activityColumns
    .filter((column) => column.slice(1, 3) === categoryCode)
    .reduce((total, column) => total + Number(row[column] || 0), 0);
}

function summarizeRespondent(row) {
  const activities = Object.entries(activityCategories).map(
    ([categoryCode, categoryName]) => ({
      category: categoryName,
      minutes: getCategoryMinutes(row, categoryCode),
    }),
  );

  return {
    respondentId: row.TUCASEID,
    age: Number(row.TEAGE),
    sex: Number(row.TESEX),
    employmentStatus: Number(row.TELFS),
    numberOfChildren: Number(row.TRCHILDNUM),
    diaryDay: Number(row.TUDIARYDAY),
    weight: Number(row.TUFINLWGT),
    activities,
  };
}

// Main processing flow
const respondents = rows.map(summarizeRespondent);
const weekdayRespondents = respondents.filter(
  (respondent) => respondent.diaryDay >= 2 && respondent.diaryDay <= 6,
);
const weekendRespondents = respondents.filter(
  (respondent) => respondent.diaryDay === 1 || respondent.diaryDay === 7,
);

console.log(`Weekday respondents: ${weekdayRespondents.length}`);
console.log(`Weekend respondents: ${weekendRespondents.length}`);

const weekdayAverage = calculateWeightedAverages(weekdayRespondents);
const weekendAverage = calculateWeightedAverages(weekendRespondents);

const overallAverage = calculateWeightedAverages(respondents);

console.log(`Summarized ${respondents.length} respondents.`);

const overallAverageTotal = overallAverage.reduce(
  (total, activity) => total + activity.averageMinutes,
  0,
);

console.log(`Overall average total: ${overallAverageTotal}`);

const comparisonData = {
  overall: overallAverage,
  weekday: weekdayAverage,
  weekend: weekendAverage,
};

//Validation & output
fs.writeFileSync(outputFile, JSON.stringify(comparisonData, null, 2), "utf8");

console.log(`Wrote processed data to ${outputFile}`);

function calculateWeightedAverages(group) {
  const totalWeight = group.reduce(
    (total, respondent) => total + respondent.weight,
    0,
  );

  return Object.values(activityCategories).map((categoryName) => {
    const weightedMinutes = group.reduce((total, respondent) => {
      const activity = respondent.activities.find(
        (item) => item.category === categoryName,
      );
      return total + activity.minutes * respondent.weight;
    }, 0);

    return {
      category: categoryName,
      averageMinutes: Math.round((weightedMinutes / totalWeight) * 10) / 10,
    };
  });
}
