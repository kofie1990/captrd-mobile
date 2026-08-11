/** @type {import('@bacons/apple-targets/app.plugin').ConfigItem} */
module.exports = {
  type: "clip",
  name: "CaptrdAppClip",
  bundleIdentifier: "live.captrd.app.appclip",
  icon: "../../assets/images/icon.png",
  exportJs: false,
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
