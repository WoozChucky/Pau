/* eslint-disable no-process-env */
export const Settings = {
  GraylogHost:
    process.env.GRAYLOG_URI || "gelf://graylog.nunolevezinho.xyz:12201",
  GraylogEnabled: process.env.GRAYLOG_URI !== null,
  AppVersion: process.env.npm_package_version,
};
