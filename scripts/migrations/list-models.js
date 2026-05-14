const https = require("https");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Failed to parse JSON: " + data.slice(0, 100)));
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function listModels() {
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }
  
  try {
    console.log("Checking v1 models...");
    const dataV1 = await get(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    if (dataV1.models) {
      console.log("V1 Models found:", dataV1.models.map(m => m.name));
    } else {
      console.log("V1 No models found or error:", dataV1);
    }
  } catch (e1) {
    console.error("V1 Models check failed:", e1.message);
  }

  try {
    console.log("\nChecking v1beta models...");
    const dataBeta = await get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (dataBeta.models) {
      console.log("V1Beta Models found:", dataBeta.models.map(m => m.name));
    } else {
      console.log("V1Beta No models found or error:", dataBeta);
    }
  } catch (e2) {
    console.error("V1Beta Models check failed:", e2.message);
  }
}

listModels();
