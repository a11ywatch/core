import { connect } from "@app/database";
import { websiteSearchParams } from "@app/core/utils";
import { controller } from "@app/proto/actions/calls";

const DEFAULT_RESPONSE = {
  script: null,
  code: 200,
  success: true,
  message: "Script updated",
};

export const ScriptsController = ({ user } = { user: null }) => ({
  getScript: async function (
    {
      pageUrl,
      userId,
      noRetries,
    }: {
      pageUrl?: string;
      userId?: number;
      filter?: boolean;
      noRetries?: boolean;
    },
    chain?: boolean
  ) {
    try {
      const [collection] = await connect("Scripts");
      const searchProps = websiteSearchParams({ pageUrl, userId });
      let scripts = await collection.findOne(searchProps);

      if (!scripts && !noRetries) {
        scripts = await collection.findOne({ pageUrl });
      }
      return chain ? [scripts, collection] : scripts;
    } catch (e) {
      console.error(e);
    }
  },
  getScripts: async function ({ userId, pageUrl }) {
    try {
      const [collection] = await connect("Scripts");
      const searchProps = websiteSearchParams({ pageUrl, userId });
      const scripts = await collection.find(searchProps).limit(1000).toArray();

      return scripts;
    } catch (e) {
      console.error(e);
    }
  },
  updateScript: async function ({
    userId,
    pageUrl,
    scriptMeta,
    editScript,
    newScript,
  }) {
    const params = {
      userId,
      pageUrl,
    };
    try {
      let [prevScript, collection] = await this.getScript(params, true);

      if (typeof scriptMeta !== "undefined") {
        prevScript.scriptMeta = scriptMeta;
      }

      const script = (await controller.setScripts({
        script: prevScript,
        editScript: !!editScript,
        newScript: newScript,
        url: String(encodeURIComponent(pageUrl)),
        userId,
      })) as any;

      script.userId = userId;

      await collection.updateOne(params, {
        $set: script,
      });

      return Object.assign({}, DEFAULT_RESPONSE, {
        script,
      });
    } catch (e) {
      console.error(e);
    }
  },
});
