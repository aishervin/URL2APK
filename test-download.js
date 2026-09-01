const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
async function test() {
  const url = 'https://api.github.com/repos/aishervin/URL2APK/actions/artifacts/9780570611/zip';
  console.log("Fetching: ", url);
  const res = await fetch(url, {
    headers: { 'Authorization': `token ${GITHUB_TOKEN}` },
    redirect: 'manual'
  });
  console.log("Status: ", res.status);
  if (res.status === 302) {
    const loc = res.headers.get('location');
    console.log("Redirect to: ", loc.substring(0, 50) + "...");
    const s3Res = await fetch(loc);
    console.log("S3 Status: ", s3Res.status);
    const buf = await s3Res.arrayBuffer();
    console.log("Downloaded bytes: ", buf.byteLength);
  } else {
    console.log(await res.text());
  }
}
test();
