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

      let scripts;

      if (Object.keys(searchProps).length) {
        scripts = await collection.findOne(searchProps);
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
  getWebsiteScripts: async function ({ userId, domain }) {
    try {
      const [collection] = await connect("Scripts");
      const searchProps = websiteSearchParams({ domain, userId });

      let scripts = [];

      if (Object.keys(searchProps).length) {
        scripts = await collection.find(searchProps).limit(0).toArray();
      }

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
      let [prevScript, collection] = await ScriptsController().getScript(
        params,
        true
      );

      if (typeof scriptMeta !== "undefined") {
        prevScript.scriptMeta = scriptMeta;
      }

      const script = (await controller.setScript({
        script: prevScript,
        editScript: !!editScript,
        newScript: newScript,
        url: decodeURIComponent(pageUrl),
        userId,
      })) as any;

      // the response
      let updatedScript;

      if (script) {
        updatedScript = Object.assign({}, prevScript, script);
      }

      if (Object.keys(params).length) {
        await collection.updateOne(params, {
          $set: updatedScript,
        });
      }

      return Object.assign({}, DEFAULT_RESPONSE, {
        script: updatedScript,
      });
    } catch (e) {
      console.error(e);
    }
  },
});
