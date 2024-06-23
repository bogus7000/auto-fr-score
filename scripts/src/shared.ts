import * as fs from "fs";
import { CleanProduct } from "./products-list";

export enum TestBench {
  v1_5 = "v1.5",
  v1_6 = "v1.6",
  v1_7 = "v1.7",
}

export function clearOutputFile(outputFilePath: string) {
  try {
    fs.writeFileSync(outputFilePath, JSON.stringify([]));
    console.log(`Output file ${outputFilePath} cleared`);
  } catch (error) {
    console.error(`Failed to clear output file ${outputFilePath}:`, error);
  }
}

export function loadProducts(inputFilePath: string): CleanProduct[] {
  try {
    const rawData = fs.readFileSync(inputFilePath, "utf8");
    return JSON.parse(rawData) as CleanProduct[];
  } catch (error) {
    console.error(`Failed to load products from ${inputFilePath}:`, error);
    return [];
  }
}
