const config = {
  verbose: true,
  setupFilesAfterEnv: ['./jest-setup-files-after-env.js']
};

if (process.env.CI) {
  Object.assign(config, {
    testResultsProcessor:
      './jest-json-reporter.js',
    reporters: [],
  });
}

module.exports = config;
