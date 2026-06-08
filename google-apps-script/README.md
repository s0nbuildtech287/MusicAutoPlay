# Google Apps Script Order Web App

This setup uses one Google Spreadsheet with two tabs:

- `List`: default playlist with the 180 base songs
- `Orders`: incoming order queue

Spreadsheet ID:

`1P_LMInRLMTjycdazok0fvRGNAsgRzMHNfK3svktA7SM`

Public links:

- Apps Script web app: `https://script.google.com/a/macros/lotusquant.com/s/AKfycbwAsOw2a06EFmdCxuOiW9gYK_mxwbMq_C2zHQ_cgfA-ptzSEploU_deM_OiRcZkS-3QPg/exec`
- Orders CSV feed: `https://docs.google.com/spreadsheets/d/e/2PACX-1vSAM339YHc5jgmAVGiyiFJLhIdBM9AgGIXmsiI6LlsC0asWMYOpeqYOdYIDOIS-YTZo759-Bw7cJfUl/pub?gid=19947411&single=true&output=csv`

## Setup

1. Open Apps Script for the spreadsheet.
2. Add `order-webapp.gs`.
3. Deploy as a Web App.
4. Set:
   - Execute as: `Me`
   - Who has access: `Anyone`

## What the script does

- Accepts public orders via the web app URL.
- Appends each order into the `Orders` tab.
- Fetches a YouTube title automatically when possible.
- Shows the recent queue on the order page.

## Columns in `Orders`

- `id`
- `timestamp`
- `status`
- `name`
- `url`
- `vid`
- `title`
- `note`

## Notes

- The desktop app should read the `Orders` tab as a CSV feed.
- The `List` tab stays as the default music source.
- Use the public links above for sharing and desktop queue sync.
- Orders are append-only.
- If you want to clear consumed order IDs on the host, remove `mcp_orderConsumedIds` from the desktop app localStorage.
