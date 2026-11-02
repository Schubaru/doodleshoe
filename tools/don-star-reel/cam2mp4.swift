// cam2mp4 <takes.json> <out.mp4>
// Recorded takes (rec.mjs: frames/*.jpg + frames.json + camera.json) -> one H.264 mp4.
// Each output frame shows the latest captured frame at that moment, cropped by the take's
// eased camera, and consecutive takes crossfade. AVFoundation only: no ffmpeg.
import AVFoundation
import AppKit

struct Frame: Decodable { let f: String; let t: Double }
struct Capture: Decodable { let t0: Double; let end: Double; let frames: [Frame] }
struct Key: Decodable { let t: Double; let x: Double; let y: Double; let z: Double; let ms: Double }
struct Take: Decodable { let dir: String; let trimStart: Double?; let trimEnd: Double? }
struct Spec: Decodable { let takes: [Take]; let fps: Int; let kbps: Int; let w: Int; let h: Int; let viewW: Double; let viewH: Double; let fade: Double }

let a = CommandLine.arguments
guard a.count >= 3 else { FileHandle.standardError.write("usage: cam2mp4 <takes.json> <out.mp4>\n".data(using: .utf8)!); exit(2) }
let specURL = URL(fileURLWithPath: a[1]), base = specURL.deletingLastPathComponent()
let spec = try JSONDecoder().decode(Spec.self, from: Data(contentsOf: specURL))
let out = URL(fileURLWithPath: a[2])

func ease(_ p: Double) -> Double { p < 0.5 ? 4 * p * p * p : 1 - pow(-2 * p + 2, 3) / 2 }

final class Clip {
    let dir: URL, cap: Capture, keys: [Key], start: Double, end: Double
    var cache: (String, CGImage)?
    init(_ t: Take) throws {
        dir = base.appendingPathComponent(t.dir)
        cap = try JSONDecoder().decode(Capture.self, from: Data(contentsOf: dir.appendingPathComponent("frames.json")))
        keys = try JSONDecoder().decode([Key].self, from: Data(contentsOf: dir.appendingPathComponent("camera.json"))).sorted { $0.t < $1.t }
        start = cap.t0 + (t.trimStart ?? 0)
        end = cap.end - (t.trimEnd ?? 0)
    }
    var duration: Double { end - start }
    /// Camera centre + zoom at absolute time t: each key eases from wherever the last one had got to.
    func camera(_ t: Double) -> (Double, Double, Double) {
        var from = (spec.viewW / 2, spec.viewH / 2, 1.0), to = from, k0 = 0.0, ms = 1.0
        func at(_ u: Double) -> (Double, Double, Double) {
            let p = ease(min(1, max(0, (u - k0) / ms)))
            return (from.0 + (to.0 - from.0) * p, from.1 + (to.1 - from.1) * p, from.2 + (to.2 - from.2) * p)
        }
        for k in keys where k.t <= t {
            from = at(k.t); to = (k.x, k.y, k.z); k0 = k.t; ms = max(1, k.ms)
        }
        return at(t)
    }
    func image(_ t: Double) -> CGImage? {
        var pick = cap.frames.first
        for f in cap.frames { if f.t <= t { pick = f } else { break } }
        guard let f = pick else { return nil }
        if let c = cache, c.0 == f.f { return c.1 }
        guard let src = CGImageSourceCreateWithURL(dir.appendingPathComponent("frames/\(f.f)") as CFURL, nil),
              let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { return nil }
        cache = (f.f, img)
        return img
    }
    func draw(_ local: Double, in ctx: CGContext, alpha: CGFloat) {
        let t = start + local
        guard let img = image(t) else { return }
        let (cx, cy, z) = camera(t)
        let s = Double(img.width) / spec.viewW
        let cw = spec.viewW / z, ch = spec.viewH / z
        let x = min(max(cx - cw / 2, 0), spec.viewW - cw), y = min(max(cy - ch / 2, 0), spec.viewH - ch)
        guard let crop = img.cropping(to: CGRect(x: x * s, y: y * s, width: cw * s, height: ch * s).integral) else { return }
        ctx.setAlpha(alpha)
        ctx.draw(crop, in: CGRect(x: 0, y: 0, width: spec.w, height: spec.h))
    }
}

let clips = try spec.takes.map(Clip.init)
let fps = Double(spec.fps), fade = spec.fade
// Timeline: take i starts where take i-1 ends minus the crossfade.
var starts: [Double] = [], cursor = 0.0
for c in clips { starts.append(cursor); cursor += c.duration - fade }
let total = cursor + fade

try? FileManager.default.removeItem(at: out)
let writer = try AVAssetWriter(outputURL: out, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: spec.w, AVVideoHeightKey: spec.h,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: spec.kbps * 1000, AVVideoMaxKeyFrameIntervalKey: spec.fps * 2,
                                      AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel],
])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32ARGB),
    kCVPixelBufferWidthKey as String: spec.w, kCVPixelBufferHeightKey as String: spec.h,
])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let count = Int((total * fps / 1000).rounded())
let queue = DispatchQueue(label: "frames"), done = DispatchSemaphore(value: 0)
var i = 0
input.requestMediaDataWhenReady(on: queue) {
    while input.isReadyForMoreMediaData {
        guard i < count else { input.markAsFinished(); done.signal(); return }
        defer { i += 1 }
        let t = Double(i) * 1000 / fps
        guard let pool = adaptor.pixelBufferPool else { continue }
        var pb: CVPixelBuffer?
        CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pb)
        guard let buf = pb else { continue }
        CVPixelBufferLockBaseAddress(buf, [])
        if let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buf), width: spec.w, height: spec.h, bitsPerComponent: 8,
                               bytesPerRow: CVPixelBufferGetBytesPerRow(buf), space: CGColorSpaceCreateDeviceRGB(),
                               bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue) {
            ctx.interpolationQuality = .high
            ctx.setFillColor(CGColor(gray: 1, alpha: 1))
            ctx.fill(CGRect(x: 0, y: 0, width: spec.w, height: spec.h))
            for (k, c) in clips.enumerated() {
                let local = t - starts[k]
                guard local >= 0, local <= c.duration else { continue }
                // the incoming take fades in over the outgoing one
                let alpha = k > 0 && local < fade ? CGFloat(ease(local / fade)) : 1
                c.draw(local, in: ctx, alpha: alpha)
            }
        }
        CVPixelBufferUnlockBaseAddress(buf, [])
        adaptor.append(buf, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: CMTimeScale(spec.fps)))
    }
}
done.wait()
writer.finishWriting { done.signal() }
done.wait()
guard writer.status == .completed else { FileHandle.standardError.write("write failed: \(writer.error?.localizedDescription ?? "?")\n".data(using: .utf8)!); exit(1) }
print("\(out.path) — \(count) frames @ \(spec.fps)fps, \(spec.w)x\(spec.h), \(String(format: "%.1f", total / 1000))s")
