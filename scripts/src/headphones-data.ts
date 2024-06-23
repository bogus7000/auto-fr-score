import fetch from "node-fetch";
import * as cheerio from "cheerio";
import * as fs from "fs";
import { CleanProduct } from "./products-list";
import { exit } from "process";
import path from "path";
import { SESSION_COOKIE, THROTTLE_MS } from "./env";
import { TestBench, clearOutputFile, loadProducts } from "./shared";

export interface HeadphoneData {
  id: string;
  fullname: string;
  neutralSoundScore?: number;
  bassAccuracyScore?: number;
  bassAccuracyDescription?: string;
  midAccuracyScore?: number;
  midAccuracyDescription?: string;
  trebleAccuracyScore?: number;
  trebleAccuracyDescription?: string;
}

function saveData(data: HeadphoneData, outputFilePath: string): void {
  try {
    let existingData: HeadphoneData[] = [];
    if (fs.existsSync(outputFilePath)) {
      const rawData = fs.readFileSync(outputFilePath, "utf8");
      existingData = JSON.parse(rawData);
    }
    existingData.push(data);
    fs.writeFileSync(outputFilePath, JSON.stringify(existingData, null, 2));
    console.log(`Data for ${data.fullname} saved successfully.`);
  } catch (error) {
    console.error(`Failed to save data for ${data.fullname}:`, error);
  }
}

async function fetchAndParseProduct(
  product: CleanProduct,
  sessionCookie: string
): Promise<HeadphoneData> {
  try {
    const response = await fetch(product.url, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9,uk;q=0.8",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie: `global-store=auto; pref-country=zz; _rtings_session=${sessionCookie}`,
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    return parseHeadphoneData(product, html);
  } catch (error) {
    console.error(
      `Failed to fetch and parse product ${product.fullname}:`,
      error
    );
    throw error;
  }
}

function parseHeadphoneData(
  product: CleanProduct,
  html: string
): HeadphoneData {
  let bassId: number;
  let midId: number;
  let trebleId: number;

  if (product.testBench === TestBench.v1_5) {
    bassId = 7919;
    midId = 7926;
    trebleId = 7932;
  } else if (product.testBench === TestBench.v1_6) {
    bassId = 21566;
    midId = 21573;
    trebleId = 21579;
  } else if (product.testBench === TestBench.v1_7) {
    bassId = 23334;
    midId = 23341;
    trebleId = 23347;
  } else {
    throw new Error(`Unknown test bench version: ${product.testBench}`);
  }

  const $ = cheerio.load(html);

  const neutralSoundScore = parseFloat(
    $(
      "div.scorecard-table > div.scorecard-row:first-child > div.scorecard-row-content > span.e-score_box.is-filled > span.e-score_box-value"
    ).text()
  );
  const bassAccuracyScore = parseFloat(
    $(
      `div.test_group[data-id="${bassId}"] > div.test_group-header > span.test_result_score > span.e-score_box-value`
    ).text()
  );
  const bassAccuracyDescription = $(
    `div.test_group[data-id="${bassId}"] > div.test_group-content > div.test_group-description > p`
  )
    .text()
    .trim();
  const midAccuracyScore = parseFloat(
    $(
      `div.test_group[data-id="${midId}"] > div.test_group-header > span.test_result_score > span.e-score_box-value`
    ).text()
  );
  const midAccuracyDescription = $(
    `div.test_group[data-id="${midId}"] > div.test_group-content > div.test_group-description > p`
  )
    .text()
    .trim();
  const trebleAccuracyScore = parseFloat(
    $(
      `div.test_group[data-id="${trebleId}"] > div.test_group-header > span.test_result_score > span.e-score_box-value`
    ).text()
  );
  const trebleAccuracyDescription = $(
    `div.test_group[data-id="${trebleId}"] > div.test_group-content > div.test_group-description > p`
  )
    .text()
    .trim();

  return {
    id: product.id,
    fullname: product.fullname,
    neutralSoundScore,
    bassAccuracyScore,
    bassAccuracyDescription,
    midAccuracyScore,
    midAccuracyDescription,
    trebleAccuracyScore,
    trebleAccuracyDescription,
  };
}

function ensureDirectoryExists(directory: string) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

async function main(): Promise<void> {
  const inputFilePath = "../data/clean-products-list.json";
  const outputFilePath = "../data/headphones-data.json";

  ensureDirectoryExists(path.dirname(outputFilePath));
  clearOutputFile(outputFilePath);

  const products = loadProducts(inputFilePath);
  const totalProducts = products.length;

  for (let i = 0; i < totalProducts; i++) {
    const product = products[i];
    try {
      const productData = await fetchAndParseProduct(product, SESSION_COOKIE);
      saveData(productData, outputFilePath);
      console.log(`Processed ${product.fullname} (${i + 1}/${totalProducts})`);
    } catch (error) {
      console.error(`Failed to process ${product.fullname}: ${error.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
  }
  exit(0);
}

main();
