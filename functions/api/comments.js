const MAX_COMMENTS = 200;
const MAX_NAME = 40;
const MAX_EMAIL = 120;
const MAX_CONTENT = 1000;

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

function normalizePath(value) {
  let path = cleanText(value, 240);
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.split("#")[0].split("?")[0];
  return path.replace(/\/{2,}/g, "/");
}

function publicComment(comment) {
  return {
    id: comment.id,
    name: comment.name,
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

async function sha256Hex(input) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function clientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"
  ).split(",")[0].trim();
}

function commentsStore(env) {
  return env.COMMENTS_KV || env.BLOG_COMMENTS;
}

async function readComments(store, path) {
  const items = await store.get(`comments:${path}`, "json");
  return Array.isArray(items) ? items : [];
}

async function writeComments(store, path, comments) {
  await store.put(`comments:${path}`, JSON.stringify(comments.slice(-MAX_COMMENTS)));
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

export async function onRequestGet({ request, env }) {
  const store = commentsStore(env);
  if (!store) {
    return json({ comments: [], error: "comments storage is not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const path = normalizePath(url.searchParams.get("path") || "/");
  const comments = await readComments(store, path);
  return json({ comments: comments.map(publicComment) });
}

export async function onRequestPost({ request, env }) {
  const store = commentsStore(env);
  if (!store) {
    return json({ error: "comments storage is not configured" }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ error: "invalid json" }, { status: 400 });
  }

  const path = normalizePath(body.path || "/");
  const name = cleanText(body.name, MAX_NAME);
  const email = cleanText(body.email, MAX_EMAIL);
  const content = cleanText(body.content, MAX_CONTENT);
  const trap = cleanText(body.website || body.company || "", 100);

  if (trap) {
    return json({ ok: true, comments: (await readComments(store, path)).map(publicComment) });
  }
  if (!name || !content) {
    return json({ error: "name and content are required" }, { status: 400 });
  }
  if (content.length < 2) {
    return json({ error: "content is too short" }, { status: 400 });
  }

  const ipHash = await sha256Hex(clientIp(request));
  const rateKey = `rate:${ipHash}:${path}`;
  if (await store.get(rateKey)) {
    return json({ error: "submit too frequently" }, { status: 429 });
  }

  const comments = await readComments(store, path);
  const now = new Date().toISOString();
  comments.push({
    id: crypto.randomUUID(),
    name,
    emailHash: email ? await sha256Hex(email.toLowerCase()) : "",
    content,
    createdAt: now,
    ipHash,
  });

  await writeComments(store, path, comments);
  await store.put(rateKey, "1", { expirationTtl: 60 });
  return json({ ok: true, comments: comments.map(publicComment) }, { status: 201 });
}
