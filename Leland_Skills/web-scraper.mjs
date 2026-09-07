export const skill = {
  id: "web-scraper",
  name: "Web Scraper",
  execute: async (url) => {
    const res = await fetch(url);
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
  }
};
export const apply = () => "Web scraper loaded.";