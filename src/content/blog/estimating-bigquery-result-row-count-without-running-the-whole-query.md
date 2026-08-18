---
title: "Estimating Bigquery result row count without running the whole query"
date: "2025-01-27"
preview: "How to estimate BigQuery result count without running the full query using dry run."
description: "BigQuery bills by bytes scanned, so COUNT(*) on a huge table is expensive. Here's how to estimate the row count from a sampled query instead."
tags: ["bigquery", "sql", "data"]
mediumUrl: "https://blog.stackademic.com/estimating-bigquery-result-count-without-running-the-whole-query-a8f05d3ed7f2"
---
Hi Guys, In this article I will be showing you how to estimate bigquery result count without running the whole thing. Usually in normal SQL databases when we need to find the number of results, we just use the following query.

```sql
SELECT COUNT(*) FROM table_name;
```

This is efficient due to following reasons,

- Minimal Data Retrieval — doesn’t fetch the actual data from the table. Instead, it just counts rows, meaning the database engine only needs to traverse internal metadata or row structures.
- Index Optimization — If there’s a specific index (like a primary key or a special count-optimized index), many modern database systems can use that to compute `COUNT(*)` much faster without scanning the entire table.
- No Transfer Overhead — With `SELECT COUNT(*)`, the database only returns a single number (the count) to the client. This is a tiny result set compared to potentially returning millions of rows with `SELECT field`

But still we do have some challenges like follows,

- If the table is **huge** and unindexed, `SELECT COUNT(*)` can still take a long time since the database may need to perform a full table scan.
- In cases where you’re applying complex filters (e.g., `WHERE` conditions), both `COUNT(*)` and `SELECT field` will take a hit since the filtering logic requires extra computation.

When it comes to Bigquery we have more challenges like follows,

- Columnar Storage in BigQuery — BigQuery stores data in a **columnar format** and processes queries by scanning the required columns.
- Data Scanning Costs — BigQuery charges based on the amount of data scanned, not just the complexity of the query. A `COUNT(*)` without any filters can end up scanning the entire table, which can be very expensive for large datasets.
- Lack of Metadata-Based Counting — Unlike traditional relational databases, BigQuery doesn’t maintain a simple row count as metadata (like in `INFORMATION_SCHEMA.tables`). It needs to calculate the row count dynamically by scanning the data.

![Stylised illustration of BigQuery dashboards, charts, and storage volumes.](./images/estimating-bigquery-result-row-count-without-running-the-whole-query/bigquery-row-estimation.jpg)

In this article I will be showing you guys a way to estimate the row count without running the whole job. In general for finding estimates of a job we have 2 options in Bigquery.

- Dry Run functionality — We can dry run the query and find the total number of bytes processed by this particular query
- Sample query — We can run a sample of the query (1 percent) and find the number of rows and then get the real value by multiplying by 100

Now the above 2 options themselves don’t give us much accurate results. Reason being first option would return us only the number of bytes processed and it’s hard to use it as a metric to calculate the number of rows (the length of 1 row could differ). Second option alone also doesn’t provide a very accurate value when tried. Therefore I came up with a method by joining both options.

In this scenario I assumed the ratio of total row count and total number of bytes processed is equal to the ratio of sample row count and sample query number of bytes processed. Now to find the total row count we can derive the following equation based on the above assumption

```
Estimated Row Count = (sampledRowCount / samplingBytesProcessed) x totalBytesProcessed
```

So I tested this for multiple queries and compared actual row count with estimated row count. I managed to get an error margin less than **_1%_** most of the time.

Now with this in mind we can code the above functionality using Javascript as follows

```typescript
import { BigQuery } from "@google-cloud/bigquery";

async function estimateRowCount() {
  const bigquery = new BigQuery();

  // Step 1: Define your full query
  const fullQuery = `
    SELECT *
    FROM \`your_project_id.your_dataset.your_table\`
    WHERE <your_conditions>
  `;

  // Step 2: Perform a dry run to get total bytes processed for the full query
  const dryRunJobConfig = {
    query: fullQuery,
    dryRun: true,
    useQueryCache: false,
  };

  const [dryRunJob] = await bigquery.createQueryJob(dryRunJobConfig);
  const totalBytesProcessed = dryRunJob?.metadata?.statistics?.totalBytesProcessed;

  if (!totalBytesProcessed) {
    throw new Error("Unable to retrieve total bytes processed from dry run.");
  }

  console.log(`Total bytes processed (dry run): ${totalBytesProcessed} bytes`);

  // Step 3: Define the sampling query (e.g., 1% of the data)
  const samplingQuery = `
    SELECT COUNT(*) AS sampled_row_count
    FROM \`your_project_id.your_dataset.your_table\`
    TABLESAMPLE SYSTEM (1 PERCENT)
    WHERE <your_conditions>
  `;

  // Step 4: Run the sampling query and get the row count
  const [samplingResult] = await bigquery.query(samplingQuery);
  const sampledRowCount = samplingResult[0].sampled_row_count;

  if (!sampledRowCount) {
    throw new Error("Sampling query returned no results.");
  }

  console.log(`Sampled row count (1% of data): ${sampledRowCount}`);

  // Step 5: Calculate the sample's processed bytes (dry-run sampling query)
  const samplingDryRunJobConfig = {
    query: samplingQuery,
    dryRun: true,
    useQueryCache: false,
  };

  const [samplingDryRunJob] = await bigquery.createQueryJob(samplingDryRunJobConfig);
  const samplingBytesProcessed = samplingDryRunJob?.metadata?.statistics?.totalBytesProcessed;

  if (!samplingBytesProcessed) {
    throw new Error("Unable to retrieve bytes processed for the sampling query.");
  }

  console.log(`Bytes processed for the sampling query: ${samplingBytesProcessed} bytes`);

  // Step 6: Estimate the total row count
  const estimatedRowCount = (sampledRowCount / samplingBytesProcessed) * totalBytesProcessed;
  console.log(`Estimated total row count: ${Math.round(estimatedRowCount)}`);

  return Math.round(estimatedRowCount);
}

estimateRowCount()
  .then((estimatedRowCount) => {
    console.log(`Final Estimated Row Count: ${estimatedRowCount}`);
  })
  .catch((err) => {
    console.error("Error estimating row count:", err);
  });
```

I hope this will be useful for you guys. Until the next article Happy Coding :P
