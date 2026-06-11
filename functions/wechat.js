function sha1Hex(input) {
  const encoder = new TextEncoder();
  return crypto.subtle.digest("SHA-1", encoder.encode(input)).then((buffer) => {
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  });
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function readXmlTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? (match[1] ?? match[2] ?? "").trim() : "";
}

function textReply(toUser, fromUser, content) {
  const now = Math.floor(Date.now() / 1000);
  return `<?xml version="1.0" encoding="UTF-8"?>
<xml>
  <ToUserName><![CDATA[${xmlEscape(toUser)}]]></ToUserName>
  <FromUserName><![CDATA[${xmlEscape(fromUser)}]]></FromUserName>
  <CreateTime>${now}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${content}]]></Content>
</xml>`;
}

function siteBase(env) {
  return (env.SITE_BASE_URL || "https://spacetop.win").replace(/\/+$/, "");
}

async function verifySignature(request, env) {
  const token = env.WECHAT_TOKEN;
  if (!token) {
    return false;
  }
  const url = new URL(request.url);
  const signature = url.searchParams.get("signature") || "";
  const timestamp = url.searchParams.get("timestamp") || "";
  const nonce = url.searchParams.get("nonce") || "";
  const source = [token, timestamp, nonce].sort().join("");
  const expected = await sha1Hex(source);
  return expected === signature;
}

export async function onRequestGet(context) {
  const ok = await verifySignature(context.request, context.env);
  const url = new URL(context.request.url);
  const echostr = url.searchParams.get("echostr") || "";

  if (!ok) {
    return new Response("invalid signature", { status: 403 });
  }

  return new Response(echostr, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function onRequestPost(context) {
  const ok = await verifySignature(context.request, context.env);
  if (!ok) {
    return new Response("invalid signature", { status: 403 });
  }

  const xml = await context.request.text();
  const toUser = readXmlTag(xml, "FromUserName");
  const fromUser = readXmlTag(xml, "ToUserName");
  const msgType = readXmlTag(xml, "MsgType");
  const event = readXmlTag(xml, "Event").toLowerCase();
  const content = readXmlTag(xml, "Content").toLowerCase();
  const base = siteBase(context.env);

  let reply = [
    "这里是堂堂一跑堂。",
    "",
    "回复「最新」查看最新文章：",
    `${base}/posts/`,
    "",
    "回复「分类」查看四个遥感 AI 分类：",
    `${base}/categories/`,
  ].join("\n");

  if (msgType === "event" && event === "subscribe") {
    reply = [
      "欢迎关注堂堂一跑堂。",
      "",
      "主要更新遥感 AI、地理空间智能和研究选题。",
      `文章列表：${base}/posts/`,
      `分类浏览：${base}/categories/`,
    ].join("\n");
  } else if (content.includes("最新") || content.includes("文章")) {
    reply = `最新文章列表：${base}/posts/`;
  } else if (content.includes("分类") || content.includes("目录")) {
    reply = `分类浏览：${base}/categories/`;
  } else if (content.includes("遥感") || content.includes("ai")) {
    reply = [
      "遥感 AI 专栏入口：",
      `${base}/categories/遥感基础模型与多模态理解/`,
      `${base}/categories/可提示分割开放词表与密集预测/`,
      "",
      "也可以直接回复「最新」或「分类」。",
    ].join("\n");
  }

  return new Response(textReply(toUser, fromUser, reply), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
