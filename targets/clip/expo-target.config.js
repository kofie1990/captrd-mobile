/** @type {import('@bacons/apple-targets/app.plugin').ConfigItem} */
module.exports = {
  type: "clip",
  name: "Captrd App Clip",
  deploymentTarget: "16.4",
  frameworks: ["SwiftUI", "AVFoundation", "ActivityKit"],
  colors: {
    $accent: "#FFFFFF",
  },
  entitlements: {
    "com.apple.developer.parent-application-identifiers": [
      "$(AppIdentifierPrefix)live.captrd.app"
    ],
    "com.apple.developer.associated-domains": [
      "applinks:captrd.live",
      "appclips:captrd.live"
    ],
    "com.apple.security.application-groups": [
      "group.live.captrd.app"
    ]
  }
};
