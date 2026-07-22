export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json([
    {
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "com.mimicrecipe.twa",
        "sha256_cert_fingerprints": [
          "E8:AB:1C:61:0D:04:73:89:84:AD:23:D4:40:0E:57:8C:F9:60:72:A5:F0:A7:71:02:C8:FA:C4:DC:BD:23:3F:9D"
        ]
      }
    }
  ]);
}
