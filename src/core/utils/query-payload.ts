type PayLoadInput = {
  payload?: {
    keyid?: number;
    audience?: any;
    subject?: any;
  };
};

type ContextInputType = {
  user?: PayLoadInput;
};

type PayLoadReturnType = {
  userId: number | null;
  audience: any;
  subject: any;
};

type OverideTypeInput = {
  id?: number;
  password?: any;
};

export const getPayLoad = (
  context?: ContextInputType,
  overide?: OverideTypeInput
): PayLoadReturnType => {
  const { keyid, audience, subject } = context?.user?.payload || {
    keyid: null,
    audience: null,
    subject: null,
  };
  const id = overide?.id;

  return {
    subject,
    audience,
    userId: typeof id !== "undefined" ? id : keyid,
  };
};
