import { controller } from "../../proto/actions/calls";

export const imageDetect = async ({ img }: { img: string }): Promise<any> => {
  let dataSource;
  try {
    dataSource = await controller.parseImg({
      img: String(img),
    });
  } catch (e) {
    console.error(e);
  }
  return dataSource;
};
