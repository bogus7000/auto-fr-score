import { SESSION_COOKIE } from "./env";
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import { exit } from "process";
import { TestBench, clearOutputFile } from "./shared";

interface ProductsList {
  data: {
    products: Product[];
  };
}

interface Product {
  id: string;
  fullname: string;
  full_url_part: string;
  url_part: string;
  brand_name: string;
  published: boolean;
  reviewed_sku_id: string;
  approximate_released_at: string;
  last_updated_at: string;
  review: {
    test_bench: {
      id: string;
      display_name: string;
    };
  };
  image: string;
  variant_skus: VariantSKU[];
  page: {
    url: string;
    early_access: boolean;
    first_published_at: string;
  };
  published_product_recommendation_count: number;
  status_discussion: {
    url: string;
    comments_count: number;
  };
}

interface VariantSKU {
  id: string;
  name: string;
  variation: string;
}

export interface CleanProduct {
  id: string;
  fullname: string;
  url: string;
  testBench: TestBench;
}

async function fetchProductsList(
  sessionCookie: string,
  outputFolder: string,
  outputFilename: string
): Promise<void> {
  await fetch("https://www.rtings.com/api/v2/safe/table_tool__products_list", {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,uk;q=0.8",
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      cookie: `global-store=auto; pref-country=zz; _rtings_session=${sessionCookie}`,
      Referer: "https://www.rtings.com/headphones/tools/table",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: '{"variables":{"test_bench_ids":["90","137","153"],"named_version":"public","is_admin":false}}',
    method: "POST",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json() as Promise<ProductsList>;
    })
    .then((data: ProductsList) => {
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }

      const outputPath = path.join(outputFolder, outputFilename);
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

      console.log(`Data saved to ${outputPath}`);
    })
    .catch((error) => {
      console.error(`Failed to fetch data: ${error.message}`);
    });
}

function readAndCleanProducts(
  inputFilePath: string,
  outputFolder: string,
  outputFilename: string
) {
  try {
    const rawData = fs.readFileSync(inputFilePath, "utf8");
    const productsList: ProductsList = JSON.parse(rawData);

    const cleanedProducts = productsList.data.products.map((product) => {
      const cleanProduct: CleanProduct = {
        id: product.id,
        fullname: product.fullname,
        url: "https://www.rtings.com" + product.page.url,
        testBench: product.review.test_bench.display_name as TestBench,
      };
      return cleanProduct;
    });

    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    const outputPath = path.join(outputFolder, outputFilename);
    fs.writeFileSync(outputPath, JSON.stringify(cleanedProducts, null, 2));

    console.log(`Cleaned data saved to ${outputPath}`);
  } catch (error) {
    console.error(`Failed to read and clean data: ${error.message}`);
  }
}

async function main(): Promise<void> {
  const outputFolder = "../data";
  const outputFilename = "products-list.json";
  clearOutputFile(outputFolder + "/" + outputFilename);
  await fetchProductsList(SESSION_COOKIE, outputFolder, outputFilename);

  const inputFilePath = outputFolder + "/" + outputFilename;
  const cleanOutputFilename = "clean-products-list.json";
  clearOutputFile(outputFolder + "/" + cleanOutputFilename);
  readAndCleanProducts(inputFilePath, outputFolder, cleanOutputFilename);
  exit(0);
}

main();
