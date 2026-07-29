import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = "3210";
const baseUrl = `http://${host}:${port}`;
const packageManagerPath = process.env.npm_execpath;
const smokeEnvironment = {
  ...process.env,
  AUTH_TRUST_HOST: "true",
  AUTH_URL: baseUrl,
  PORT: port,
};
const child = packageManagerPath
  ? spawn(process.execPath, [packageManagerPath, "start", "-H", host, "-p", port], {
      env: smokeEnvironment,
      stdio: "inherit",
    })
  : spawn("pnpm", ["start", "-H", host, "-p", port], {
      env: smokeEnvironment,
      stdio: "inherit",
    });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForApplication() {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js smoke sunucusu erken kapandı: ${child.exitCode}`);
    }

    try {
      const response = await fetch(`${baseUrl}/randevu`, { redirect: "manual" });
      if (response.status === 200) return;
    } catch {
      // The server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("Next.js smoke sunucusu 30 saniye içinde hazır olmadı.");
}

async function runSmokeChecks() {
  await waitForApplication();

  const bookingResponse = await fetch(`${baseUrl}/randevu`, { redirect: "manual" });
  const bookingHtml = await bookingResponse.text();

  assert(bookingResponse.status === 200, "/randevu 200 dönmelidir.");
  assert(
    bookingHtml.includes("Yeni randevu talebi şu anda kapalı"),
    "Kapalı public booking durumu görünür olmalıdır.",
  );
  assert(!bookingHtml.includes("<form"), "Kapalı public booking sayfası form içermemelidir.");
  assert(
    bookingResponse.headers.get("x-frame-options") === "DENY",
    "X-Frame-Options DENY olmalıdır.",
  );
  assert(
    bookingResponse.headers.get("x-content-type-options") === "nosniff",
    "X-Content-Type-Options nosniff olmalıdır.",
  );
  assert(
    bookingResponse.headers.get("content-security-policy")?.includes("frame-ancestors 'none'"),
    "CSP frame-ancestors koruması bulunmalıdır.",
  );

  // /yonetim is auth-gated: an unauthenticated request must redirect to /giris.
  const adminResponse = await fetch(`${baseUrl}/yonetim`, {
    redirect: "manual",
  });

  assert(
    adminResponse.status >= 300 && adminResponse.status < 400,
    "/yonetim kimlik doğrulaması olmadan yönlendirmelidir.",
  );
  assert(
    (adminResponse.headers.get("location") ?? "").endsWith("/giris"),
    "/yonetim yetkisiz istekte /giris'e yönlendirmelidir.",
  );

  // The exact Dashboard build must be wired and served under /yonetim-static.
  const dashboardResponse = await fetch(`${baseUrl}/yonetim-static/index.html`, {
    redirect: "manual",
  });
  const dashboardHtml = await dashboardResponse.text();

  assert(dashboardResponse.status === 200, "/yonetim-static/index.html 200 dönmelidir.");
  assert(
    dashboardHtml.includes("/yonetim/assets/"),
    "/yonetim-static exact Dashboard build'ini sunmalıdır.",
  );
}

try {
  await runSmokeChecks();
  console.log("Production-build smoke kontrolleri başarılı.");
} finally {
  if (child.exitCode === null) child.kill("SIGTERM");
}
