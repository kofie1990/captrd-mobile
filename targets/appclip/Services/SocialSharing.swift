import Foundation
import UIKit

class SocialSharing {
    static let shared = SocialSharing()
    
    private init() {}
    
    func shareToInstagramStory(imageUrl: String) {
        guard let url = URL(string: imageUrl) else { return }
        
        DispatchQueue.global().async {
            do {
                let data = try Data(contentsOf: url)
                guard let image = UIImage(data: data) else { return }
                
                DispatchQueue.main.async {
                    if let appUrl = URL(string: "instagram-stories://share?source_application=live.captrd.app.Clip") {
                        if UIApplication.shared.canOpenURL(appUrl) {
                            let items: [String: Any] = [
                                "com.instagram.sharedSticker.backgroundImage": image.jpegData(compressionQuality: 1.0) ?? data
                            ]
                            UIPasteboard.general.setItems([items], options: [.expirationDate: Date().addingTimeInterval(60 * 5)])
                            UIApplication.shared.open(appUrl, options: [:], completionHandler: nil)
                        } else {
                            self.fallbackShare(image: image)
                        }
                    }
                }
            } catch {
                print("Failed to download image for IG Story: \(error)")
            }
        }
    }
    
    func shareToSnapchat(imageUrl: String) {
        guard let url = URL(string: imageUrl) else { return }
        
        DispatchQueue.global().async {
            do {
                let data = try Data(contentsOf: url)
                guard let image = UIImage(data: data) else { return }
                
                DispatchQueue.main.async {
                    let snapUrl = URL(string: "snapchat://creativeKitWeb")!
                    if UIApplication.shared.canOpenURL(snapUrl) {
                        // Native Creative Kit without SDK is complex as it requires specific payload, 
                        // fallback to activity view controller for Snap but users can pick Snapchat
                        self.fallbackShare(image: image)
                    } else {
                        self.fallbackShare(image: image)
                    }
                }
            } catch {
                print("Failed to download image for Snap: \(error)")
            }
        }
    }
    
    private func fallbackShare(image: UIImage) {
        let activityVC = UIActivityViewController(activityItems: [image], applicationActivities: nil)
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first,
           let rootVC = window.rootViewController {
            rootVC.present(activityVC, animated: true, completion: nil)
        }
    }
    
    func saveMedia(url: String) {
        guard let urlObj = URL(string: url) else { return }
        DispatchQueue.global().async {
            do {
                let data = try Data(contentsOf: urlObj)
                DispatchQueue.main.async {
                    if urlObj.pathExtension.lowercased() == "mp4" {
                        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(urlObj.lastPathComponent)
                        try? data.write(to: tempURL)
                        UISaveVideoAtPathToSavedPhotosAlbum(tempURL.path, nil, nil, nil)
                    } else {
                        if let image = UIImage(data: data) {
                            UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
                        }
                    }
                }
            } catch {
                print("Failed to download media: \(error)")
            }
        }
    }
}
