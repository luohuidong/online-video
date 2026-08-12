// Domain errors raised by the image-proxy pipeline. The HTTP boundary
// (image-proxy.controller) maps each class to a status code; the service
// and fetcher layers only throw these and stay HTTP-agnostic.

export class UnsupportedContentTypeError extends Error {
  constructor(public readonly contentType: string) {
    super(`Unsupported content-type: ${contentType}`);
    this.name = 'UnsupportedContentTypeError';
  }
}

export class ImageTooLargeError extends Error {
  constructor(public readonly bytes: number) {
    super(`Image too large: ${bytes} bytes`);
    this.name = 'ImageTooLargeError';
  }
}

export class UpstreamFetchError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'UpstreamFetchError';
  }
}
