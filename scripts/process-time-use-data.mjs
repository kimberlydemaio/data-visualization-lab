import fs from "node:fs";
import path from "node:path";
import { csvParse } from "d3";

const sourceFile = path.join(
  process.cwd(),
  "data-source",
  "where-the-hours-go",
  "atussum_2025.dat",
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

const rawData = fs.readFileSync(sourceFile, "utf8");
const rows = csvParse(rawData);

const activityColumns = rows.columns.filter((column) =>
  /^t\d{6}$/.test(column),
);

console.log(`Loaded ${rows.length} respondents.`);
console.log(Object.keys(rows[0]).slice(0, 15));

console.log(`Found ${activityColumns.length} activity columns.`);
console.log(activityColumns.slice(0, 10));

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

const respondents = rows.map(summarizeRespondent);

console.log(`Summarized ${respondents.length} respondents.`);
