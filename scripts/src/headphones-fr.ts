import fetch from "node-fetch";
import { SESSION_COOKIE, THROTTLE_MS } from "./env";
import * as fs from "fs";
import * as path from "path";
import { clearOutputFile, loadProducts } from "./shared";

interface FrGraphUrlData {
  data: {
    product: {
      review: {
        test_results: {
          graph_data_url: string;
        }[];
      };
    };
  };
}

interface FrGraphData {
  header: string[];
  data: (number | null)[][];
}

export interface HeadphoneFrData {
  id: string;
  fullname: string;
  header: string[];
  data: number[][];
}

async function getFrGraphUrl(
  productId: string,
  productName: string,
  testId: string = "3992"
): Promise<FrGraphUrlData> {
  const productNameLowercase = productName.toLowerCase().split(" ").join("_");

  const response = await fetch(
    "https://www.rtings.com/api/v2/safe/app/graph_tool__product_graph_data_url",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,uk;q=0.8",
        "content-type": "application/json",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        cookie: `global-store=auto; pref-country=zz; _rtings_session=${SESSION_COOKIE}`,
        Referer: `https://www.rtings.com/headphones/graph/${testId}/frequency-response/${productNameLowercase}/${productId}`,
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: JSON.stringify({
        variables: {
          product_id: productId,
          test_original_id: testId,
          named_version: "public",
        },
      }),
      method: "POST",
    }
  );
  return response.json() as Promise<FrGraphUrlData>;
}

async function getFrGraphData(url: string): Promise<FrGraphData> {
  const response = await fetch("https://i.rtings.com" + url, {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,uk;q=0.8",
      priority: "u=1, i",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      Referer: "https://www.rtings.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: null,
    method: "GET",
  });
  return response.json() as Promise<FrGraphData>;
}

function processFrGraphData(data: FrGraphData): number[][] {
  const { header, data: rows } = data;
  const frequencyIndex = header.indexOf("Frequency");
  const leftIndex = 1;
  const rightIndex = 2;
  const targetResponseIndex = header.indexOf("Target Response");

  const cleanRows = rows
    .map((row) => {
      const frequency = row[frequencyIndex] as number;
      const targetResponse = row[targetResponseIndex] as number;

      let left = row[leftIndex];
      let right = row[rightIndex];

      if (left === null || right === null) {
        const leftIndex = 4;
        const rightIndex = 5;
        left = row[leftIndex];
        right = row[rightIndex];
      }

      return [frequency, left, right, targetResponse];
    })
    .filter((row) => row.every((value) => value !== null));
  return cleanRows as number[][];
}

async function main() {
  const inputFilePath = "../data/clean-products-list.json";
  const products = loadProducts(inputFilePath);
  const totalProducts = products.length;
  const outputFolder = "../data";
  const outputFilePath = path.join(outputFolder, "headphones-fr-data.json");

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  clearOutputFile(outputFilePath);

  for (let i = 0; i < totalProducts; i++) {
    const product = products[i];
    try {
      const graphUrlData = await getFrGraphUrl(product.id, product.fullname);
      const graphUrl =
        graphUrlData.data.product.review.test_results[0].graph_data_url;
      const graphData = await getFrGraphData(graphUrl);

      const processedData = processFrGraphData(graphData);

      graphData.header.splice(4, 2);

      const headphoneFrData: HeadphoneFrData = {
        id: product.id,
        fullname: product.fullname,
        header: graphData.header,
        data: processedData,
      };

      const existingData = JSON.parse(
        fs.readFileSync(outputFilePath, "utf8")
      ) as HeadphoneFrData[];
      existingData.push(headphoneFrData);
      fs.writeFileSync(outputFilePath, JSON.stringify(existingData, null, 2));

      console.log(`Processed ${product.fullname} (${i + 1}/${totalProducts})`);
    } catch (error) {
      console.error(`Failed to process ${product.fullname}: ${error.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
  }
}

main();
