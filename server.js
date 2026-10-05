import express from "express";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION;


// ===============================
// HOME
// ===============================
app.get("/", (req, res) => {
  res.send("WhatsApp Bot is running 🚀");
});


// ===============================
// META WEBHOOK VERIFICATION
// ===============================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully!");
    return res.status(200).send(challenge);
  }

  console.log("Webhook verification failed!");
  return res.sendStatus(403);
});


// ===============================
// RECEIVE WHATSAPP MESSAGES
// ===============================
app.post("/webhook", async (req, res) => {

  // Tell Meta we received the webhook
  res.sendStatus(200);

  try {

    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const message = value?.messages?.[0];

    if (!message) {
      return;
    }

    const sender = message.from;

    const profileName =
      value?.contacts?.[0]?.profile?.name || "Unknown";

    console.log("--------------------------------");
    console.log("New WhatsApp Message");
    console.log("Name:", profileName);
    console.log("Number:", sender);
    console.log("Type:", message.type);
    console.log("--------------------------------");


    // ===============================
    // TEXT MESSAGE
    // ===============================

    if (message.type === "text") {

      const text = message.text?.body || "";

      console.log("Message:", text);

      const lowerText = text.toLowerCase();


      // WHO IS THIS?
      if (
        lowerText.includes("who am i") ||
        lowerText.includes("who is this") ||
        lowerText.includes("mama kawda") ||
        lowerText.includes("මම කවුද")
      ) {

        await sendMessage(
          sender,
          `👤 ඔබව හඳුනාගත් විස්තර\n\n` +
          `Name: ${profileName}\n` +
          `WhatsApp Number: +${sender}\n\n` +
          `⚠️ මෙය WhatsApp වෙතින් ලබාදෙන profile information එකයි.`
        );

        return;
      }


      // HELP
      if (
        lowerText === "help" ||
        lowerText === "menu" ||
        lowerText === "start"
      ) {

        await sendMessage(
          sender,
          `🤖 WhatsApp AI Assistant\n\n` +
          `මට ඉදිරියේදී මේවා කරන්න පුළුවන්:\n\n` +
          `🎤 Voice Commands\n` +
          `🤖 AI Chat\n` +
          `👤 Sender Identification\n` +
          `🔗 URL Processing\n` +
          `🎬 Authorized Video Processing\n\n` +
          `Command එකක් හෝ message එකක් එවන්න.`
        );

        return;
      }


      // URL DETECTION
      const urlRegex =
        /(https?:\\/\\/[^\\s]+)/i;

      const urlMatch = text.match(urlRegex);

      if (urlMatch) {

        const url = urlMatch[0];

        console.log("URL received:", url);

        await sendMessage(
          sender,
          `🔗 URL එක ලැබුණා.\n\n` +
          `🌐 ${url}\n\n` +
          `Video processing feature එක backend එකට ඊළඟ අදියරේදී connect කරමු.`
        );

        return;
      }


      // NORMAL MESSAGE
      await sendMessage(
        sender,
        `🤖 Message එක ලැබුණා!\n\n` +
        `ඔබ: ${text}\n\n` +
        `👤 ${profileName}\n` +
        `📱 +${sender}`
      );

      return;
    }


    // ===============================
    // VOICE MESSAGE
    // ===============================

    if (message.type === "audio") {

      console.log("Voice message received.");
      console.log("Audio ID:", message.audio?.id);

      await sendMessage(
        sender,
        `🎤 Voice message එක ලැබුණා!\n\n` +
        `Voice command system එක ඉදිරියේදී Speech-to-Text + AI සමඟ connect කරමු.`
      );

      return;
    }


    // ===============================
    // IMAGE
    // ===============================

    if (message.type === "image") {

      await sendMessage(
        sender,
        `🖼️ Image එක ලැබුණා!\n\n` +
        `AI image processing feature එක පසුව connect කරමු.`
      );

      return;
    }


    // ===============================
    // VIDEO
    // ===============================

    if (message.type === "video") {

      await sendMessage(
        sender,
        `🎬 Video එක ලැබුණා!\n\n` +
        `Video processing system එක ඉදිරියේදී add කරමු.`
      );

      return;
    }


  } catch (error) {

    console.error("Webhook Error:", error);

  }

});


// ===============================
// SEND WHATSAPP MESSAGE
// ===============================

async function sendMessage(to, message) {

  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  try {

    const response = await fetch(url, {

      method: "POST",

      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        messaging_product: "whatsapp",

        to: to,

        type: "text",

        text: {
          body: message
        }

      })

    });


    const data = await response.json();

    console.log("WhatsApp API:", data);

  } catch (error) {

    console.error("Send Message Error:", error);

  }

}


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

  console.log(`WhatsApp Bot running on port ${PORT}`);

});
