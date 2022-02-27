import type { Request, Response } from "express";
import type { Issue } from "@app/types";

const downloadToExcel = (
  _req: Request,
  res: Response,
  _next: any,
  data: Issue | any
) => {
  const excel = require("exceljs");
  const workbook = new excel.Workbook();
  const pageName = data?.url ?? "Website";
  const worksheet = workbook.addWorksheet(
    `${data?.domain} Accessibility Audit`,
    {
      headerFooter: {
        firstHeader: `Accessibility score - ${data?.website?.adaScore}`,
        firstFooter: `Test ran ${data?.website?.lastScanDate}`,
      },
    }
  );

  worksheet.columns = [
    { header: "Code", key: "code", width: 14, checked: 0 },
    { header: "Type", key: "type", width: 5, checked: 0 },
    { header: "Message", key: "message", width: 30, checked: 0 },
    { header: "Context", key: "context", width: 40, checked: 0 },
    { header: "Selector", key: "selector", width: 30, checked: 0 },
    { header: "Audit", key: "checked", width: 5, outlineLevel: 1, checked: 0 },
  ];

  worksheet.addRows(
    (data?.issue?.length ? data?.issue : data?.issues).map((items) => ({
      ...items,
      style: { font: { name: "Helvetica" } },
    }))
  );

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + `${pageName}-audit.xlsx`
  );

  return workbook.xlsx.write(res).then(function () {
    res.status(200).end();
  });
};

export { downloadToExcel };
