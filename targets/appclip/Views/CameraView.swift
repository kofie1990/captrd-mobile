import SwiftUI
import AVFoundation

struct CameraView: View {
    let event: Event
    
    @StateObject private var model = CameraViewModel()
    @State private var showGrid = false
    @State private var flashMode: AVCaptureDevice.FlashMode = .off
    @State private var isCapturing = false
    @State private var guestName: String = ""
    @State private var photosCount = 0
    @State private var isUploading = false
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            if let image = model.photo?.image {
                // Preview Mode
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                
                VStack {
                    Spacer()
                    HStack(spacing: 60) {
                        Button(action: {
                            model.retakePhoto()
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.white)
                                .background(Circle().fill(Color.black.opacity(0.5)))
                        }
                        
                        Button(action: {
                            uploadPhoto(image: image)
                        }) {
                            if isUploading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .black))
                                    .frame(width: 60, height: 60)
                                    .background(Circle().fill(Color.white))
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 60))
                                    .foregroundColor(.white)
                                    .background(Circle().fill(Color.black.opacity(0.5)))
                            }
                        }
                        .disabled(isUploading)
                    }
                    .padding(.bottom, 40)
                }
            } else {
                // Viewfinder Mode
                CameraPreview(session: model.session)
                    .ignoresSafeArea()
                
                // UI Overlay (Grid, Reticle, Top Bar)
                VStack {
                    // Top Bar
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(guestName)'s Roll".uppercased())
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(Color.white.opacity(0.7))
                                .tracking(2)
                            
                            Text("\(photosCount) / \(event.max_pictures_per_user ?? 10) EXPOSURES")
                                .font(.system(size: 9))
                                .foregroundColor(Color.white.opacity(0.4))
                                .tracking(2)
                        }
                        
                        Spacer()
                        
                        HStack(spacing: 8) {
                            Button(action: {
                                flashMode = flashMode == .off ? .on : .off
                                model.setFlashMode(flashMode)
                            }) {
                                Image(systemName: flashMode == .on ? "bolt.fill" : "bolt.slash.fill")
                                    .foregroundColor(flashMode == .on ? .yellow : .white.opacity(0.7))
                                    .frame(width: 44, height: 44)
                                    .background(Circle().fill(Color.white.opacity(0.1)))
                            }
                            
                            Button(action: {
                                showGrid.toggle()
                            }) {
                                Image(systemName: "square.grid.3x3.fill")
                                    .foregroundColor(.white)
                                    .frame(width: 44, height: 44)
                                    .background(Circle().fill(showGrid ? Color.white.opacity(0.3) : Color.white.opacity(0.1)))
                            }
                            
                            Button(action: {
                                model.flipCamera()
                            }) {
                                Image(systemName: "arrow.triangle.2.circlepath.camera.fill")
                                    .foregroundColor(.white)
                                    .frame(width: 44, height: 44)
                                    .background(Circle().fill(Color.white.opacity(0.1)))
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    
                    Spacer()
                    
                    // Reticle
                    ZStack {
                        RoundedRectangle(cornerRadius: 32)
                            .stroke(Color.white.opacity(0.15), lineWidth: 1)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .padding(16)
                            
                        if showGrid {
                            GeometryReader { geo in
                                Path { path in
                                    let w = geo.size.width
                                    let h = geo.size.height
                                    path.move(to: CGPoint(x: w/3, y: 0))
                                    path.addLine(to: CGPoint(x: w/3, y: h))
                                    path.move(to: CGPoint(x: w*2/3, y: 0))
                                    path.addLine(to: CGPoint(x: w*2/3, y: h))
                                    path.move(to: CGPoint(x: 0, y: h/3))
                                    path.addLine(to: CGPoint(x: w, y: h/3))
                                    path.move(to: CGPoint(x: 0, y: h*2/3))
                                    path.addLine(to: CGPoint(x: w, y: h*2/3))
                                }
                                .stroke(Color.white.opacity(0.2), lineWidth: 1)
                            }
                        }
                        
                        // Center dot
                        Circle()
                            .stroke(Color.white.opacity(0.25), lineWidth: 1)
                            .frame(width: 56, height: 56)
                        Circle()
                            .fill(Color.white.opacity(0.3))
                            .frame(width: 4, height: 4)
                    }
                    .padding(.vertical, 40)
                    
                    Spacer()
                    
                    // Shutter Button
                    Button(action: {
                        isCapturing = true
                        model.capturePhoto()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            isCapturing = false
                        }
                    }) {
                        Circle()
                            .stroke(Color.white, lineWidth: 4)
                            .frame(width: 80, height: 80)
                            .overlay(
                                Circle()
                                    .fill(Color.white)
                                    .frame(width: 64, height: 64)
                                    .scaleEffect(isCapturing ? 0.9 : 1.0)
                                    .animation(.spring(), value: isCapturing)
                            )
                    }
                    .padding(.bottom, 32)
                    .disabled(isCapturing)
                }
            }
        }
        .onAppear {
            guestName = LocalStorage.shared.getGuestName(for: event.id) ?? "Guest"
            model.startSession()
            fetchPhotosCount()
        }
        .onDisappear {
            model.stopSession()
        }
    }
    
    private func fetchPhotosCount() {
        SupabaseClient.shared.fetchPhotos(for: event.id) { result in
            if case .success(let photos) = result {
                DispatchQueue.main.async {
                    self.photosCount = photos.filter { $0.guest_name == self.guestName }.count
                }
            }
        }
    }
    
    private func uploadPhoto(image: UIImage) {
        guard let data = image.jpegData(compressionQuality: 0.8) else { return }
        
        isUploading = true
        SupabaseClient.shared.uploadPhoto(data: data, eventId: event.id, guestName: guestName) { result in
            DispatchQueue.main.async {
                isUploading = false
                switch result {
                case .success(_):
                    photosCount += 1
                    model.retakePhoto() // Reset to camera view
                case .failure(let error):
                    print("Upload failed: \(error)")
                }
            }
        }
    }
}

// MARK: - AVFoundation ViewModel

class CameraViewModel: NSObject, ObservableObject, AVCapturePhotoCaptureDelegate {
    @Published var session = AVCaptureSession()
    @Published var photo: PhotoData?
    
    private var photoOutput = AVCapturePhotoOutput()
    private var currentPosition: AVCaptureDevice.Position = .back
    private var currentFlashMode: AVCaptureDevice.FlashMode = .off
    
    struct PhotoData {
        var image: UIImage
    }
    
    override init() {
        super.init()
        setupCamera()
    }
    
    func setupCamera() {
        session.beginConfiguration()
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: currentPosition),
              let input = try? AVCaptureDeviceInput(device: device) else {
            return
        }
        
        if session.canAddInput(input) { session.addInput(input) }
        if session.canAddOutput(photoOutput) { session.addOutput(photoOutput) }
        session.commitConfiguration()
    }
    
    func flipCamera() {
        session.beginConfiguration()
        session.inputs.forEach { session.removeInput($0) }
        currentPosition = currentPosition == .back ? .front : .back
        
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: currentPosition),
              let input = try? AVCaptureDeviceInput(device: device) else {
            return
        }
        
        if session.canAddInput(input) { session.addInput(input) }
        session.commitConfiguration()
    }
    
    func setFlashMode(_ mode: AVCaptureDevice.FlashMode) {
        self.currentFlashMode = mode
    }
    
    func startSession() {
        DispatchQueue.global(qos: .background).async {
            self.session.startRunning()
        }
    }
    
    func stopSession() {
        session.stopRunning()
    }
    
    func capturePhoto() {
        let settings = AVCapturePhotoSettings()
        settings.flashMode = currentFlashMode
        photoOutput.capturePhoto(with: settings, delegate: self)
    }
    
    func retakePhoto() {
        photo = nil
    }
    
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard let data = photo.fileDataRepresentation(),
              let image = UIImage(data: data) else { return }
        
        DispatchQueue.main.async {
            self.photo = PhotoData(image: image)
        }
    }
}

// MARK: - Camera Preview Wrapper

struct CameraPreview: UIViewRepresentable {
    class VideoPreviewView: UIView {
        override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
        var videoPreviewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
    }
    
    let session: AVCaptureSession
    
    func makeUIView(context: Context) -> VideoPreviewView {
        let view = VideoPreviewView()
        view.videoPreviewLayer.session = session
        view.videoPreviewLayer.videoGravity = .resizeAspectFill
        return view
    }
    
    func updateUIView(_ uiView: VideoPreviewView, context: Context) {}
}
