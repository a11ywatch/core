// get the name of the domain flat without .com
export const domainName = (domain) => {
  let base = domain.split(".");

  if (base.length >= 2) {
    base.pop(); // remove the tld
  }
  return base[base.length - 1];
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
