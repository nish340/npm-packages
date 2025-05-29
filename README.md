# 🧰 NPM Packages

Welcome! I'm **Nishchay Sharma** (`@nish34`) — a backend developer focused on building reusable, production-grade NPM packages for Express.js and Node.js projects.

---

## 📦 Packages Index

| Package Name | Description |
|--------------|-------------|
| [`@nish34/create-express-app`](#1-create-express-app) | Scaffold Express projects with database/auth/middleware |
| [`@nish34/express-mongoose-starter`](#2-express-mongoose-starter) | Full Mongoose + JWT starter project |
| [`@nish34/express-upload-zone`](#3-express-upload-zone) | Secure file upload middleware |
| [`@nish34/express-query-builder`](#4-express-query-builder) | Query parser for filters, pagination, search |
| [`@nish34/express-response-formatter`](#5-express-response-formatter) | Standard API response wrapper |
| [`@nish34/express-api-throttle`](#6-express-api-throttle) | Advanced per-user/IP rate limiting |
| [`@nish34/express-activity-log`](#7-express-activity-log) | Logs user activity from Express routes |

---

## 1. [`@nish34/create-express-app`](https://www.npmjs.com/package/@nish34/create-express-app)

> ⚡ Scaffold a full Express.js app in seconds using a CLI.

### Features:
- Choose JS/TS (currently JS only)
- Choose DB: MongoDB, MySQL, PostgreSQL
- Optional middlewares: Morgan, Helmet, Logger, JWT Auth
- Generates `.env`, `README.md`, complete folder structure

### Usage:
```bash
npx @nish34/create-express-app my-app
