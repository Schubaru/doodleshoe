// frames2mp4 <framesDir> <out.mp4> <fps>
// PNG frames -> H.264 mp4, via AVFoundation. No Homebrew, no ffmpeg.
import AVFoundation
import AppKit

let a = CommandLine.arguments
guard a.count >= 4, let fps = Int32(a[3]) else {
    FileHandle.standardError.write("usage: frames2mp4 <framesDir> <out.mp4> <fps> [kbps]\n".data(using: .utf8)!)
    exit(2)
}
let dir = URL(fileURLWithPath: a[1]), out = URL(fileURLWithPath: a[2])
let kbps = a.count >= 5 ? Int(a[4]) ?? 0 : 0   // 0 = size-derived default

let frames = try FileManager.default
    .contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
    .filter { $0.pathExtension.lowercased() == "png" }
    .sorted { $0.lastPathComponent < $1.lastPathComponent }
guard let first = frames.first, let probe = NSImage(contentsOf: first)?.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    FileHandle.standardError.write("no readable png frames in \(dir.path)\n".data(using: .utf8)!)
    exit(1)
}
// H.264 wants even dimensions
let w = probe.width - probe.width % 2, h = probe.height - probe.height % 2

try? FileManager.default.removeItem(at: out)
let writer = try AVAssetWriter(outputURL: out, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: w, AVVideoHeightKey: h,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: kbps > 0 ? kbps * 1000 : w * h * 6, AVVideoMaxKeyFrameIntervalKey: fps],
])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32ARGB),
    kCVPixelBufferWidthKey as String: w, kCVPixelBufferHeightKey as String: h,
])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let queue = DispatchQueue(label: "frames")
let done = DispatchSemaphore(value: 0)
var i = 0
input.requestMediaDataWhenReady(on: queue) {
    while input.isReadyForMoreMediaData {
        guard i < frames.count else { input.markAsFinished(); done.signal(); return }
        defer { i += 1 }
        guard let img = NSImage(contentsOf: frames[i])?.cgImage(forProposedRect: nil, context: nil, hints: nil),
              let pool = adaptor.pixelBufferPool else { continue }
        var pb: CVPixelBuffer?
        CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pb)
        guard let buf = pb else { continue }
        CVPixelBufferLockBaseAddress(buf, [])
        if let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buf), width: w, height: h,
                               bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buf),
                               space: CGColorSpaceCreateDeviceRGB(),
                               bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue) {
            ctx.setFillColor(CGColor(gray: 1, alpha: 1))
            ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
            ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
        }
        CVPixelBufferUnlockBaseAddress(buf, [])
        adaptor.append(buf, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: fps))
    }
}
done.wait()
writer.finishWriting { done.signal() }
done.wait()
if writer.status != .completed {
    FileHandle.standardError.write("write failed: \(writer.error?.localizedDescription ?? "?")\n".data(using: .utf8)!)
    exit(1)
}
print("\(out.path) — \(frames.count) frames @ \(fps)fps, \(w)x\(h)")
