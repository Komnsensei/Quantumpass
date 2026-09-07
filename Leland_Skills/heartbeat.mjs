export const skill = {
  id: "heartbeat",
  name: "Leland Heartbeat",
  execute: async () => ({
    pid: process.pid,
    uptime: process.uptime(),
    rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    alive: true,
    ts: new Date().toISOString()
  })
};
export const apply = () => "Heartbeat loaded.";