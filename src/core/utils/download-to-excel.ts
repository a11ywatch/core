import excel from "exceljs";
import type { FastifyContext } from "apollo-server-fastify";
import type { Issue } from "../../types/types";
import { StatusCode } from "../../web/messages/message";

const downloadToExcel = async (
  _req: FastifyContext["request"],
  res: FastifyContext["reply"],
  data: Issue | any
) => {
  const source = data?.website ? data?.website : data;

  if (!source) {
    res.status(StatusCode.Ok).send();
    return;
  }

  try {
    const workbook = new excel.Workbook();
    const pageName = source?.url ?? "Website";

    const worksheet = workbook.addWorksheet(`${source?.domain} WCAG Audit`, {
      headerFooter: {
        firstHeader: `Accessibility score - ${source.issuesInfo?.adaScore}`,
        firstFooter: `Test ran ${source?.lastScanDate}`,
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

    const rowIssues = source?.issue?.length ? source.issue : source?.issues;

    const rows = (rowIssues ?? []).map((items) => ({
      ...items,
      style: { font: { name: "Helvetica" } },
    }));

    if (rows.length) {
      worksheet.addRows(rows);
    }

    res.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.header(
      "Content-Disposition",
      "attachment; filename=" + `${pageName}-audit.xlsx`
    );

    // convert to buffer instead of streaming
    const buffer = await workbook.xlsx.writeBuffer();

    res.status(StatusCode.Ok).send(buffer);
  } catch (e) {
    console.error(e);
    res.status(StatusCode.Error).send();
  }
};

export { downloadToExcel };
