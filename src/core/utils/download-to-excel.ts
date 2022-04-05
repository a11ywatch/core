import type { Request, Response } from "express";
import type { Issue } from "@app/types";
import excel from "exceljs";

const downloadToExcel = async (
  _req: Request,
  res: Response,
  _next: any,
  data: Issue | any
) => {
  try {
    const workbook = new excel.Workbook();
    const pageName = data?.url ?? "Website";
    const worksheet = workbook.addWorksheet(`${data?.domain} WCAG Audit`, {
      headerFooter: {
        firstHeader: `Accessibility score - ${data?.website?.adaScore}`,
        firstFooter: `Test ran ${data?.website?.lastScanDate}`,
      },
    });

    worksheet.columns = [
      { header: "Code", key: "code", width: 14, checked: 0 },
      { header: "Type", key: "type", width: 5, checked: 0 },
      { header: "Message", key: "message", width: 30, checked: 0 },
      { header: "Context", key: "context", width: 40, checked: 0 },
      { header: "Selector", key: "selector", width: 30, checked: 0 },
      {
        header: "Audit",
        key: "checked",
        width: 5,
        outlineLevel: 1,
        checked: 0,
      },
    ] as any;

    const rowIssues = data?.issue?.length ? data?.issue : data?.issues;

    const rows = (rowIssues ?? []).map((items) => ({
      ...items,
      style: { font: { name: "Helvetica" } },
    }));

    if (rows.length) {
      worksheet.addRows(rows);
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `${pageName}-audit.xlsx`
    );

    await workbook.xlsx.write(res);

    res.status(200).end();
  } catch (e) {
    console.error(e);
  }
};

export { downloadToExcel };
