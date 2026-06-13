export function WebcamFeed({
  videoRef,
  showVideo,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  showVideo: boolean;
}) {
  return (
    <video
      ref={videoRef}
      className="webcam-feed"
      style={{ display: showVideo ? 'block' : 'none' }}
      playsInline
      autoPlay
      muted
      aria-label="Webcam feed for hand tracking"
    />
  );
}
