const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJseW5uaGFydmV5NjBAZ21haWwuY29tIiwiZXhwIjoxNzg1MTAzMDgyLCJpYXQiOjE3NzczMjcwODJ9.mRAT0WAkNrEo6wfZcEoNmxrE5ob0WZADTMgUcL9IzAg";
const APP = "69d81ac3ffa24327b49b171a";
const CONV = "69d8858f1ea6692d59bc0ac2";
const msg = process.argv[2] || "hello from CLI";

const headers = {
  "Content-Type": "application/json",
  "X-App-Id": APP,
  "Authorization": "Bearer " + TOKEN
};

console.log("Sending:", msg);
const r = await fetch("https://base44.app/api/apps/" + APP + "/agents/conversations/v2/" + CONV + "/messages", {
  method: "POST",
  headers,
  body: JSON.stringify({ role: "user", content: msg })
});
console.log("Status:", r.status);
const d = await r.text();
console.log("Reply:", d.substring(0, 3000));
