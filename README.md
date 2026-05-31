# Budget Detective

Budget Detective is a proof-of-concept web app that helps non-technical users understand Washington State vendor payment data without writing SQL or using a traditional BI dashboard.

## Problem

Most non-technical users do not know how to query raw government spending data. A city councilmember, journalist, or citizen may want to know where money went, who received it, and what spending areas dominate, but the raw dataset is too large and technical to explore directly.

I chose to build an automatic insight experience instead of a dashboard because non-technical users often do not know what question to ask first. The app starts by surfacing the most important spending patterns in plain English.

## What I Built

The app loads Washington State vendor payment CSV data and automatically generates four beginner-friendly insights:

1. Where did most money go?
2. Who received the most money?
3. What type of spending dominates?
4. What specific spending area stands out?

Each insight includes:

- A plain-English answer
- A large readable value
- A short explanation
- A "why this matters" note
- A supporting chart

## Tech Stack

- React
- TypeScript
- Vite
- PapaParse for CSV loading
- Recharts for charts
- Lucide React for icons

## Architecture

```text
CSV file
  -> csvLoader
  -> normalized payment rows
  -> insightEngine
  -> insight cards and chart data
  -> React UI