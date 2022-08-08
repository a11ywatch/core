// get the name of the domain flat without .com
export const domainName = (domain: string) => {
  let base = domain?.split(".");
  const tldMatch = base?.length >= 2;

  if (tldMatch) {
    base.pop(); // remove the tld
  }

  return base && tldMatch ? base[base.length - 1] : domain;
};

// find a website by flat name.
export const domainNameFind = (params, domain) => {
  return {
    $or: [
      {
        ...params,
        domain: {
          $regex: new RegExp(domainName(domain)),
        },
      },
      { ...params, domain },
    ],
  };
};
