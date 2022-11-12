/* eslint-disable no-process-env */
export const Settings = {
  GraylogHost: process.env.GRAYLOG_URI || "gelf://127.0.0.1:12201",
  GraylogEnabled: process.env.GRAYLOG_URI !== null,
  AppVersion: process.env.npm_package_version,
};