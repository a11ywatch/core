export const root = (_req, res) => {
  res.json({
    server_status: "online",
  });
};
