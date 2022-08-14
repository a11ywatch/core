export const root = (_req, res) => {
  res.status(200);

  res.send({
    server_status: "online",
  });
};
