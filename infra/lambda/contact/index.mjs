import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({});

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const FROM_ADDRESS = process.env.FROM_ADDRESS;
const TO_ADDRESS = process.env.TO_ADDRESS;

const LIMITS = { name: 120, email: 254, phone: 40, message: 4000 };

function reply(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": ALLOWED_ORIGIN,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function clean(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export const handler = async (event) => {
  const method = event?.requestContext?.http?.method;

  if (method === "OPTIONS") return reply(204, {});
  if (method !== "POST") return reply(405, { error: "Method not allowed." });

  // Function URLs are public by design, so re-check the origin here rather
  // than trusting the browser's CORS preflight.
  const origin = event?.headers?.origin;
  if (origin && origin !== ALLOWED_ORIGIN) {
    return reply(403, { error: "Forbidden." });
  }

  let payload;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body ?? "", "base64").toString("utf8")
      : (event.body ?? "");
    payload = JSON.parse(raw);
  } catch {
    return reply(400, { error: "We couldn't read that submission. Please try again." });
  }

  // Honeypot: a field hidden from people but filled in by most bots.
  if (clean(payload.company, 100)) {
    // Report success so the bot doesn't learn to adapt.
    return reply(200, { ok: true });
  }

  const name = clean(payload.name, LIMITS.name);
  const email = clean(payload.email, LIMITS.email);
  const phone = clean(payload.phone, LIMITS.phone);
  const message = clean(payload.message, LIMITS.message);

  if (!name) return reply(400, { error: "Please tell us your name." });
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return reply(400, { error: "Please enter an email address we can reply to." });
  }
  if (!message) return reply(400, { error: "Please include a message." });

  const body = [
    `Name:    ${name}`,
    `Email:   ${email}`,
    phone ? `Phone:   ${phone}` : null,
    "",
    message,
  ]
    .filter((line) => line !== null)
    .join("\n");

  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: FROM_ADDRESS,
        Destination: { ToAddresses: [TO_ADDRESS] },
        ReplyToAddresses: [email],
        Content: {
          Simple: {
            Subject: { Data: `Website enquiry from ${name}`, Charset: "UTF-8" },
            Body: { Text: { Data: body, Charset: "UTF-8" } },
          },
        },
      })
    );
  } catch (err) {
    // Log the detail, return a generic message — same convention the actions
    // server follows.
    console.error("ses_send_failed", { message: err?.message, name: err?.name });
    return reply(502, { error: "We couldn't send your message. Please try again shortly." });
  }

  return reply(200, { ok: true });
};
