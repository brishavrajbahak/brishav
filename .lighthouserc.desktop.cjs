module.exports = {
  ci: {
    collect: {
      url: ["http://127.0.0.1:8788/"],
      startServerCommand: "npm run start -- --port 8788",
      startServerReadyPattern: "Ready on",
      numberOfRuns: 2,
      settings: {
        preset: "desktop",
        chromeFlags: "--disable-gpu --disable-dev-shm-usage --no-sandbox"
      }
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }]
      }
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci/desktop" }
  }
};
